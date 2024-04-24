const { SlashCommandBuilder } = require('discord.js');
const notificationSchema = require('../../schemas/notification');
const retainerSchema = require('../../schemas/retainers');
const itemsIds = require('../../items');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('cancel-notification')
		.setDescription('Cancel the notifications of an item.')
		.addStringOption(option =>
			option.setName('item-id')
                .setDescription('The ID of the item')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('retainer')
                .setDescription('The name of the retainer selling the item')
                .setRequired(true)
                .setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices;
        let filtered;
        if (focusedOption.name === 'item-id') {
            choices = itemsIds;
            // console.log(choices);
            filtered = choices.filter(choice => choice.en.toLowerCase().includes(focusedOption.value.toLowerCase())).slice(0, 25);

            await interaction.respond(
                filtered.map(choice => ({ name: choice.en, value: choice.id.toString() })),
            );

        }
        if (focusedOption.name === 'retainer') {
            // choices = itemsIds;
            choices = await retainerSchema.find({ userID:interaction.user.id });
            // console.log(choices);
            filtered = choices.filter(choice => choice.retainerName.toLowerCase().includes(focusedOption.value)).slice(0, 25);

            await interaction.respond(
                filtered.map(choice => ({ name: choice.retainerName, value: choice.retainerName })),
            );

        }

    },
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
