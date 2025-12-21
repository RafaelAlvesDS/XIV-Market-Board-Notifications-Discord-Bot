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

        if (message.event.includes('listings/add') && listings) {
            // Processa todas as listagens de uma vez para evitar spam de notificações
            await this.handleListings(trackers, listings, world);
        } else if (message.event.includes('sales/add') && sales) {
            for (const sale of sales) {
                await this.handleSales(trackers, sale, world);
            }
        } else if (message.event.includes('listings/remove') && listings) {
            for (const listing of listings) {
                await this.handleListingsRemove(trackers, listing, world);
            }
        }
    }

    async handleListingsRemove(trackers, listing, worldId) {
        for (const tracker of trackers) {
            // Se o listingID removido for o do usuário OU o nome do retainer for o do usuário
            // Isso garante que detectamos a remoção mesmo se o listingID tiver mudado (ex: update perdido)
            if (listing.listingID === tracker.listingID || listing.retainerName === tracker.retainerName) {
                // Não removemos o item do banco, pois o usuário pode estar apenas ajustando o preço.
                // O monitoramento continua ativo com o último preço conhecido.
                
                // ATUALIZAÇÃO: Marcamos como não listado para evitar falsos positivos de undercut
                tracker.listingID = null;
                tracker.isUndercut = false;
                await tracker.save();

                // Notificação removida a pedido do usuário (redução de spam)
            }
        }
    }

    async handleListings(trackers, listings, worldId) {
        for (const tracker of trackers) {
            // 1. Verificar se o usuário atualizou seu próprio listing
            // Se houver múltiplas entradas do usuário (raro), pegamos a última
            const userListings = listings.filter(l => l.retainerName === tracker.retainerName);
            
            if (userListings.length > 0) {
                const latestUserListing = userListings[userListings.length - 1];
                tracker.lastKnownPrice = latestUserListing.pricePerUnit;
                tracker.lastKnownQuantity = latestUserListing.quantity;
                tracker.listingID = latestUserListing.listingID; 
                tracker.isUndercut = false;
                await tracker.save();
            }

            // Se o usuário não tem listingID (não está listado), ignora undercuts
            if (!tracker.listingID) continue;

            // 2. Verificar Undercuts
            // Filtra listings que não são do usuário e que são mais baratos
            const undercuts = listings.filter(l => {
                if (l.retainerName === tracker.retainerName) return false;
                if (tracker.isHQ && !l.hq) return false; // Se usuário é HQ, ignora NQ
                return l.pricePerUnit < tracker.lastKnownPrice;
            });

            if (undercuts.length > 0) {
                // Pega o menor preço entre os undercuts para notificar
                const bestUndercut = undercuts.reduce((prev, curr) => 
                    prev.pricePerUnit < curr.pricePerUnit ? prev : curr
                );

                // Atualiza status de undercut
                if (!tracker.isUndercut) {
                    tracker.isUndercut = true;
                    await tracker.save();

                    this.sendNotification(tracker.userId, {
                        title: '⚠️ Undercut Detectado!',
                        color: 0xFF0000,
                        fields: [
                            { name: 'Item', value: tracker.itemName, inline: true },
                            { name: 'Seu Preço', value: `${tracker.lastKnownPrice.toLocaleString()} gil`, inline: true },
                            { name: 'Novo Preço', value: `${bestUndercut.pricePerUnit.toLocaleString()} gil`, inline: true },
                            { name: 'Retainer Rival', value: bestUndercut.retainerName, inline: true },
                            { name: 'Mundo', value: tracker.homeServerName, inline: true },
                            { name: 'Qualidade', value: bestUndercut.hq ? 'HQ' : 'NQ', inline: true }
                        ]
                    });
                }
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
