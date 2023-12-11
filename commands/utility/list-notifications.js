const { SlashCommandBuilder } = require('discord.js');
const notificationSchema = require('../../schemas/notification');
const itemsIds = require('../../items');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('list-notifications')
		.setDescription('List your notifications.'),
	async execute(interaction) {

        try {
            const data = await notificationSchema.find({
                userID: interaction.user.id,
            });
            console.log(data.length);
            if (data.length == 0) {
                await interaction.reply('Você não tem nenhuma notificação ativa.');
            }
            if (data.length > 0) {
                let filtered;
                let message = '';
                data.forEach(async function(dataItem) {
                    filtered = itemsIds.filter(choice => choice.id == dataItem.itemID);
                    message += 'Retainer: ' + dataItem.retainer + ' | Item ID: [' + filtered[0].en + '](https://universalis.app/market/' + dataItem.itemID + ') | Home Server: ' + dataItem.homeServer + ' | Listings: ' + dataItem.listings + '\n' ;
                });
                console.log(message);
                await interaction.reply(message);
            }
        }
        catch (error) {
            console.log(error);
        }

	},
};
