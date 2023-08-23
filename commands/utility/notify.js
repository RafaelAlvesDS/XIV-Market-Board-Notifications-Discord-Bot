const { SlashCommandBuilder } = require('discord.js');
const notificationSchema = require('../../schemas/notification');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('notify')
		.setDescription('Notify when someone cuts your price on the market board!')
		.addStringOption(option =>
			option.setName('item-id')
				.setDescription('The ID of the item')
				.setRequired(true))
        .addStringOption(option =>
            option.setName('retainer')
                .setDescription('The name of the retainer selling the item')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('home-server')
                .setDescription('The name of your home server. Ex: Behemoth')
                .setRequired(true)),
	async execute(interaction) {
        const itemID = interaction.options.getString('item-id').trim();
        const homeServer = interaction.options.getString('home-server').trim();
        const retainer = interaction.options.getString('retainer').trim();

        try {
            const data = await notificationSchema.findOne({
                retainer: retainer,
                itemID: itemID,
            });

            if (!data) {
                notificationSchema.create({
                    userID : interaction.user.id,
                    channelID: interaction.channel.id,
                    itemID: itemID,
                    homeServer: homeServer,
                    retainer: retainer,
                    notified: false,
                });
                await interaction.reply('Tá salvo!');
            }
            if (data) {
                console.log(data);
                await interaction.reply('Já tinha pedido isso antes meu nobre.');
            }
        }
        catch (error) {
            console.log(error);
        }

	},
};
