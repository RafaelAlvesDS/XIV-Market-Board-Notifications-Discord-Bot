const { Events } = require('discord.js');
const notificationSchema = require('../schemas/notification');
const worldsManager = require('../worldsManager');
const socketManager = require('../socketManager');
const itemsManager = require('../itemsManager');
const axios = require('axios');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        // 0. Carregar Itens (para autocomplete)
        await itemsManager.loadItems();

        // 1. Carregar Mundos
        await worldsManager.loadWorlds();

        // 2. Conectar ao WebSocket
        socketManager.connect();

        // 3. Carregar notificações, sincronizar estado inicial e inscrever
        const notifications = await notificationSchema.find({});
        console.log(`Carregando e sincronizando ${notifications.length} notificações...`);

        // Agrupar notificações por Item + Mundo para evitar chamadas duplicadas à API
        const uniqueRequests = {};
        for (const notification of notifications) {
            const key = `${notification.itemID}-${notification.homeServer}`;
            if (!uniqueRequests[key]) {
                uniqueRequests[key] = [];
            }
            uniqueRequests[key].push(notification);
        }

        const requestKeys = Object.keys(uniqueRequests);
        console.log(`Otimizado para ${requestKeys.length} requisições únicas.`);

        for (const key of requestKeys) {
            const group = uniqueRequests[key];
            const firstNotif = group[0]; // Dados comuns (itemID, homeServer)
            
            const worldId = worldsManager.getIdByName(firstNotif.homeServer);
            if (worldId) {
                // 3.1 Inscrever no WebSocket (Listings e Sales)
                const listingChannel = `listings/add{item=${firstNotif.itemID},world=${worldId}}`;
                const salesChannel = `sales/add{item=${firstNotif.itemID},world=${worldId}}`;
                
                socketManager.subscribe(listingChannel);
                socketManager.subscribe(salesChannel);

                // 3.2 Sincronizar estado inicial via REST (Snapshot) (apenas uma vez por item/mundo)
                try {
                    const apiUrl = `https://universalis.app/api/v2/${firstNotif.homeServer}/${firstNotif.itemID}`;
                    const response = await axios.get(apiUrl);
                    const listings = response.data.listings || [];
                    
                    // Atualizar cada notificação do grupo individualmente
                    for (const notification of group) {
                        const matchingListings = listings.filter(l => l.retainerName && l.retainerName.includes(notification.retainer));
                        
                        await notificationSchema.updateOne(
                            { _id: notification._id },
                            { $set: { listings: matchingListings.length } }
                        );
                    }
                } catch (error) {
                    console.error(`Erro ao sincronizar inicialização para item ${firstNotif.itemID}:`, error.message);
                }

            } else {
                console.warn(`Mundo não encontrado para notificação: ${firstNotif.homeServer}`);
            }
        }

        // Cache para armazenar o timestamp da última chegada de venda por item/mundo
        const lastSaleArrival = new Map(); // Key: "worldID-itemID", Value: Date.now()

        // 4. Configurar listeners do Socket
        socketManager.on('salesUpdate', (message) => {
            // message: { item, world, sales: [...] }
            const key = `${message.world}-${message.item}`;
            lastSaleArrival.set(key, Date.now());
            // console.log(`Venda detectada para ${key} às ${new Date().toLocaleTimeString()}`);
        });

        socketManager.on('listingUpdate', async (message) => {
            try {
                // message: { item, world, listings: [...] }
                const worldName = worldsManager.getNameById(message.world);
                if (!worldName) return;

                // Buscar notificações para este item/mundo
                const interestedUsers = await notificationSchema.find({
                    itemID: message.item.toString(),
                    homeServer: worldName
                });

                for (const dataItem of interestedUsers) {
                    const channel = await client.channels.fetch(dataItem.channelID).catch(() => null);
                    if (!channel) continue;

                    let matchingListings = message.listings.filter(listing => 
                        listing.retainerName && listing.retainerName.includes(dataItem.retainer)
                    );

                    // Lógica de Venda com Verificação via WebSocket Sales (Sem REST)
                    if (matchingListings.length < dataItem.listings) {
                        // Aguarda um pouco para garantir que o evento de venda (sales/add) tenha chegado
                        // pois listings/add e sales/add podem chegar em ordens variadas
                        setTimeout(async () => {
                            const key = `${message.world}-${message.item}`;
                            const lastSaleTime = lastSaleArrival.get(key) || 0;
                            const timeDiff = Date.now() - lastSaleTime;

                            // Se recebemos um evento de venda nos últimos 30 segundos para este item/mundo
                            if (timeDiff < 30000) {
                                channel.send({ content: `<@${dataItem.userID}> Um item foi vendido no mercado! 💰\nItem: https://universalis.app/market/${dataItem.itemID}` });
                                
                                // Atualiza o banco com a nova quantidade
                                await notificationSchema.updateOne(
                                    { _id: dataItem._id },
                                    { $set: { listings: matchingListings.length } }
                                );
                            } else {
                                // Se a quantidade diminuiu mas NÃO houve evento de venda recente:
                                // Pode ser cancelamento, expiração ou upload parcial.
                                // Atualizamos o banco silenciosamente para manter a sincronia, mas NÃO notificamos venda.
                                // console.log(`Item removido sem venda confirmada (Diff: ${timeDiff}ms). Atualizando silenciosamente.`);
                                await notificationSchema.updateOne(
                                    { _id: dataItem._id },
                                    { $set: { listings: matchingListings.length } }
                                );
                            }
                        }, 2000); // Delay de 2 segundos
                    } else if (matchingListings.length > dataItem.listings) {
                        // Reposição de estoque
                        await notificationSchema.updateOne(
                            { _id: dataItem._id },
                            { $set: { notified: false, listings: matchingListings.length } }
                        );
                    }

                    // Lógica de Undercut
                    let isUndercut = false;
                    const userHQListings = matchingListings.filter(listing => listing.hq);
                    const userNQListings = matchingListings.filter(listing => !listing.hq);

                    // Se o usuário vende HQ, compara apenas com outros HQ
                    if (userHQListings.length > 0) {
                        const globalHQListings = message.listings.filter(listing => listing.hq);
                        if (globalHQListings.length > 0 && globalHQListings[0].pricePerUnit < userHQListings[0].pricePerUnit) {
                            isUndercut = true;
                        }
                    }

                    // Se o usuário vende NQ, compara com o mais barato geral
                    if (userNQListings.length > 0) {
                        if (message.listings.length > 0 && message.listings[0].pricePerUnit < userNQListings[0].pricePerUnit) {
                            isUndercut = true;
                        }
                    }

                    // Notificar Undercut
                    if (isUndercut && dataItem.notified === false && matchingListings.length > 0) {
                        channel.send({ content: `<@${dataItem.userID}> Anunciaram mais barato que você o item: https://universalis.app/market/${dataItem.itemID}` });
                        await notificationSchema.updateOne(
                            { _id: dataItem._id },
                            { $set: { notified: true } }
                        );
                    }

                    // Resetar notificação se recuperou o preço
                    if (!isUndercut && dataItem.notified === true) {
                        await notificationSchema.updateOne(
                            { _id: dataItem._id },
                            { $set: { notified: false } }
                        );
                    }
                }
            } catch (error) {
                console.error('Erro ao processar listingUpdate:', error);
            }
        });

        console.log('Sistema de notificações via WebSocket iniciado.');
    },
};
