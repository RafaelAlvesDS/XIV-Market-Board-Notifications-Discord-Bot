const { SlashCommandBuilder } = require('discord.js');
const notificationSchema = require('../../schemas/notification');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cancel-notification')
		.setDescription('Cancel the notifications of an item.')
		.addStringOption(option =>
			option.setName('item-id')
				.setDescription('The ID of the item')
				.setRequired(true))
        .addStringOption(option =>
            option.setName('retainer')
                .setDescription('The name of the retainer selling the item')
                .setRequired(true)),
	async execute(interaction) {
        const itemID = interaction.options.getString('item-id').trim();
        const retainer = interaction.options.getString('retainer').trim();

        try {
            await notificationSchema.deleteOne({
                retainer: retainer,
                itemID: itemID,
                userID: interaction.user.id,
            });
            await interaction.reply('Notificação cancelada.');
        }
        catch (error) {
            console.log(error);
        }

	},
};
