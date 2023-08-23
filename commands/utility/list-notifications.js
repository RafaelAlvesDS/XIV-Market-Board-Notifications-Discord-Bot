const { SlashCommandBuilder } = require('discord.js');
const notificationSchema = require('../../schemas/notification');

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
                let message = '';
                data.forEach(async function(dataItem) {
                    message += 'Retainer: ' + dataItem.retainer + ' | Item ID: ' + dataItem.itemID + ' | Home Server: ' + dataItem.homeServer + '\n' ;
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
