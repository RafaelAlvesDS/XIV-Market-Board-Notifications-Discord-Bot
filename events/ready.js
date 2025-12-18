const { Events } = require('discord.js');
const notificationSchema = require('../schemas/notification');
const axios = require('axios');


module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		setInterval(async () => {
			console.log('Rodando notificações.');
			try {
				const data = await notificationSchema.find({});
				if (data) {
					// console.log(data);
					data.forEach(async function(dataItem) {
						const apiUrl = 'https://universalis.app/api/v2/' + dataItem.homeServer + '/' + dataItem.itemID + '?&entries=0&noGst=1';
						async function fetchData() {
							try {
								const response = await axios.get(apiUrl);
								const responseData = response.data;
								// console.log(JSON.stringify(responseData));
								// console.log(responseData.listings[0].retainerName);
								const channel = await client.channels.fetch(dataItem.channelID);
								const matchingListings = responseData.listings.filter(listing => listing.retainerName.includes(dataItem.retainer));
								console.log(`Number of listings ${dataItem.itemID} with retainerName containing ${dataItem.retainer}: ${matchingListings.length}`);
								// atualiza o numero de itens vendidos caso o user adicione mais itens no mercado
								if (matchingListings.length > dataItem.listings) {
									// console.log('item adicionado');
									try {
										await notificationSchema.updateOne({ itemID: dataItem.itemID, retainer: dataItem.retainer }, { $set: { notified: false, listings: matchingListings.length } });
									}
									catch (error) {
										console.log(error);
									}
								}
								// avisa o usuario que ele vendeu um item no mercado

								if (matchingListings.length < dataItem.listings) {
									channel.send({ content: '<@' + dataItem.userID + '> Um item foi vendido no mercado: https://universalis.app/market/' + dataItem.itemID });
									try {
										await notificationSchema.updateOne({ itemID: dataItem.itemID, retainer: dataItem.retainer }, { $set: { listings: matchingListings.length } });
									}
									catch (error) {
										console.log(error);
									}
								}

								// Verifica se houve undercut (HQ vs HQ ou NQ vs Geral)
								let isUndercut = false;
								const userHQListings = matchingListings.filter(listing => listing.hq);
								const userNQListings = matchingListings.filter(listing => !listing.hq);

								// Se o usuário vende HQ, compara apenas com outros HQ
								if (userHQListings.length > 0) {
									const globalHQListings = responseData.listings.filter(listing => listing.hq);
									if (globalHQListings.length > 0 && globalHQListings[0].pricePerUnit < userHQListings[0].pricePerUnit) {
										isUndercut = true;
									}
								}

								// Se o usuário vende NQ, compara com o mais barato geral (qualquer qualidade mais barata rouba a venda)
								if (userNQListings.length > 0) {
									if (responseData.listings.length > 0 && responseData.listings[0].pricePerUnit < userNQListings[0].pricePerUnit) {
										isUndercut = true;
									}
								}

								// avisa o usuario que alguem cobriu o preço dele no mercado
								if (isUndercut && dataItem.notified == false && matchingListings.length > 0) {
									channel.send({ content: '<@' + dataItem.userID + '> Anunciaram mais barato que você o item: https://universalis.app/market/' + dataItem.itemID });
									try {
										await notificationSchema.updateOne({ itemID: dataItem.itemID, retainer: dataItem.retainer }, { $set: { notified: true } });
									}
									catch (error) {
										console.log(error);
									}
								}
								// atualiza status de notificado quando o item do usuario for o mais barato
								if (!isUndercut && dataItem.notified == true) {
									try {
										await notificationSchema.updateOne({ itemID: dataItem.itemID, retainer: dataItem.retainer }, { $set: { notified: false } });
									}
									catch (error) {
										console.log(error);
									}
								}
							}
							catch (error) {
								console.error('Error making API request:', error);
								console.log('Deu Ruim!');
							}
						}
						fetchData();
					});
				}
			}
			catch (error) {
				console.log(error);
			}
		}, 300000);
		// tá rodando a cada 300000ms = 5 minutos
	},
};
