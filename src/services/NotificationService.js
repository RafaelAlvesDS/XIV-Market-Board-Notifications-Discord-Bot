const UniversalisSocket = require('./UniversalisSocket');
const TrackedItem = require('../models/TrackedItem');
const User = require('../models/User');
const Bottleneck = require('bottleneck');
const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

class NotificationService {
    constructor() {
        this.client = null; // Discord Client
        
        // Limiter para REST API (25 req/s)
        this.limiter = new Bottleneck({
            minTime: 40, // 1000ms / 25 = 40ms
            maxConcurrent: 5
        });
    }

    init(discordClient) {
        this.client = discordClient;
        
        // Ouvir eventos do WebSocket
        UniversalisSocket.on('message', (msg) => this.handleMessage(msg));
        
        // Carregar inscrições iniciais
        this.refreshSubscriptions();
    }

    async refreshSubscriptions() {
        const distinctWorlds = await TrackedItem.distinct('homeServerId');
        UniversalisSocket.subscribeToWorlds(distinctWorlds);
    }

    async handleMessage(message) {
        if (!message.event) return;

        // Extrair dados comuns
        const { item, world, listings, sales } = message;
        
        // Se não tem item ou world, ignora
        if (!item || !world) return;

        // Buscar quem está rastreando este item neste mundo
        const trackers = await TrackedItem.find({ itemId: item, homeServerId: world });
        if (trackers.length === 0) return;

        if (message.event.includes('listings/add') && listings && listings.length > 0) {
            this.handleListings(trackers, listings[0], world);
        } else if (message.event.includes('sales/add') && sales && sales.length > 0) {
            this.handleSales(trackers, sales[0], world);
        } else if (message.event.includes('listings/remove') && listings && listings.length > 0) {
            this.handleListingsRemove(trackers, listings[0], world);
        }
    }

    async handleListingsRemove(trackers, listing, worldId) {
        for (const tracker of trackers) {
            // Se o listingID removido for o do usuário
            if (listing.listingID === tracker.listingID) {
                // Não removemos o item do banco, pois o usuário pode estar apenas ajustando o preço.
                // O monitoramento continua ativo com o último preço conhecido.
                
                this.sendNotification(tracker.userId, {
                    title: '⚠️ Listagem Removida',
                    color: 0xFFA500,
                    fields: [
                        { name: 'Item', value: tracker.itemName, inline: true },
                        { name: 'Status', value: 'Item saiu do Market Board. Monitoramento mantido (aguardando reposição ou ajuste).', inline: false }
                    ]
                });
            }
        }
    }

    async handleListings(trackers, listing, worldId) {
        for (const tracker of trackers) {
            // Se for o próprio retainer do usuário atualizando
            if (listing.retainerName === tracker.retainerName) {
                tracker.lastKnownPrice = listing.pricePerUnit;
                tracker.lastKnownQuantity = listing.quantity;
                tracker.listingID = listing.listingID; // Atualiza listingID se mudar
                // Se o usuário atualizou o preço, assumimos que ele corrigiu o undercut
                tracker.isUndercut = false;
                await tracker.save();
                continue;
            }

            // Lógica HQ: Se o usuário vende HQ, só importa se o undercut for HQ
            if (tracker.isHQ && !listing.hq) continue;

            // Lógica de Undercut: Preço menor que o registrado pelo usuário
            if (listing.pricePerUnit < tracker.lastKnownPrice) {
                // Atualiza status de undercut
                if (!tracker.isUndercut) {
                    tracker.isUndercut = true;
                    await tracker.save();
                }

                this.sendNotification(tracker.userId, {
                    title: '⚠️ Undercut Detectado!',
                    color: 0xFF0000,
                    fields: [
                        { name: 'Item', value: tracker.itemName, inline: true },
                        { name: 'Seu Preço', value: `${tracker.lastKnownPrice.toLocaleString()} gil`, inline: true },
                        { name: 'Novo Preço', value: `${listing.pricePerUnit.toLocaleString()} gil`, inline: true },
                        { name: 'Retainer Rival', value: listing.retainerName, inline: true },
                        { name: 'Mundo', value: tracker.homeServerName, inline: true },
                        { name: 'Qualidade', value: listing.hq ? 'HQ' : 'NQ', inline: true }
                    ]
                });
            }
        }
    }

    async handleSales(trackers, sale, worldId) {
        for (const tracker of trackers) {
            // Lógica de Venda Provável: Preço e Quantidade idênticos
            // E qualidade compatível
            if (sale.pricePerUnit === tracker.lastKnownPrice && 
                sale.quantity === tracker.lastKnownQuantity &&
                sale.hq === tracker.isHQ) {
                
                this.sendNotification(tracker.userId, {
                    title: '💰 Venda Provável!',
                    color: 0x00FF00,
                    fields: [
                        { name: 'Item', value: tracker.itemName, inline: true },
                        { name: 'Valor Unitário', value: `${sale.pricePerUnit.toLocaleString()} gil`, inline: true },
                        { name: 'Quantidade', value: sale.quantity.toString(), inline: true },
                        { name: 'Total', value: `${sale.total.toLocaleString()} gil`, inline: true },
                        { name: 'Comprador', value: sale.buyerName || 'Desconhecido', inline: true }
                    ]
                });
            }
        }
    }

    async sendNotification(userId, embedData) {
        try {
            const user = await this.client.users.fetch(userId);
            if (user) {
                const embed = new EmbedBuilder()
                    .setTitle(embedData.title)
                    .setColor(embedData.color)
                    .addFields(embedData.fields)
                    .setTimestamp();
                
                await user.send({ embeds: [embed] });
            }
        } catch (err) {
            console.error(`Erro ao enviar DM para ${userId}:`, err);
        }
    }

    // Método para carga inicial via REST (Fallback)
    async checkInitialPrice(itemId, worldId, retainerName) {
        return this.limiter.schedule(async () => {
            try {
                const url = `https://universalis.app/api/v2/${worldId}/${itemId}`;
                const response = await axios.get(url);
                const data = response.data;

                if (!data.listings || data.listings.length === 0) return null;

                // Tenta encontrar o retainer do usuário
                const userListing = data.listings.find(l => l.retainerName === retainerName);
                
                if (userListing) {
                    // Verificar se já existe undercut no momento do registro
                    const isUndercut = data.listings.some(l => 
                        l.retainerName !== retainerName && // Outro vendedor
                        l.hq === userListing.hq && // Mesma qualidade
                        l.pricePerUnit < userListing.pricePerUnit // Preço menor
                    );

                    return {
                        price: userListing.pricePerUnit,
                        quantity: userListing.quantity,
                        hq: userListing.hq,
                        listingID: userListing.listingID,
                        isUndercut: isUndercut
                    };
                }
                return null;
            } catch (err) {
                console.error('Erro na API REST:', err.message);
                return null;
            }
        });
    }
}

module.exports = new NotificationService();
