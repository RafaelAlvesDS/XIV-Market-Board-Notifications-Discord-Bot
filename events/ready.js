const { Events } = require('discord.js');
const notificationSchema = require('../schemas/notification');
const axios = require('axios');


module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		setInterval(async () => {
			console.timeStamp('Rodando notificações.');
			try {
				const data = await notificationSchema.find({});
				if (data) {
					// console.log(data);
					data.forEach(async function(dataItem) {
						const apiUrl = 'https://universalis.app/api/v2/' + dataItem.homeServer + '/' + dataItem.itemID + '?listings=1&entries=0&noGst=1';
						async function fetchData() {
							try {
								const response = await axios.get(apiUrl);
								const responseData = response.data;
								// console.log(JSON.stringify(responseData));
								// console.log(responseData.listings[0].retainerName);
								const channel = await client.channels.fetch(dataItem.channelID);
								if (responseData.listings[0].retainerName != dataItem.retainer && dataItem.notified == false) {
									channel.send({ content: '<@' + dataItem.userID + '> Anunciaram mais barato que você o item: https://universalis.app/market/' + dataItem.itemID });
									try {
										await notificationSchema.updateOne({ itemID: dataItem.itemID, retainer: dataItem.retainer }, { $set: { notified: true } });
									}
									catch (error) {
										console.log(error);
									}
								}
								if (responseData.listings[0].retainerName == dataItem.retainer && dataItem.notified == true) {
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
