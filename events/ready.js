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
                // 3.1 Inscrever no WebSocket (apenas uma vez por canal)
                const channel = `listings/add{item=${firstNotif.itemID},world=${worldId}}`;
                socketManager.subscribe(channel);

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

        // 4. Configurar listeners do Socket
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

                    const matchingListings = message.listings.filter(listing => 
                        listing.retainerName && listing.retainerName.includes(dataItem.retainer)
                    );

                    // console.log(`Update para ${dataItem.retainer}: ${matchingListings.length} listings ativas.`);

                    // Lógica de Venda (baseada na contagem de listings)
                    if (matchingListings.length < dataItem.listings) {
                        channel.send({ content: `<@${dataItem.userID}> Um item foi vendido no mercado: https://universalis.app/market/${dataItem.itemID}` });
                        await notificationSchema.updateOne(
                            { _id: dataItem._id },
                            { $set: { listings: matchingListings.length } }
                        );
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
