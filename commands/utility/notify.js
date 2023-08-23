const { SlashCommandBuilder } = require('discord.js');
// const axios = require('axios');
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
        const itemID = interaction.options.getString('item-id');
        const homeServer = interaction.options.getString('home-server');
        const retainer = interaction.options.getString('retainer');
        // const apiUrl = 'https://universalis.app/api/v2/' + homeServer + '/' + itemID + '?listings=1&entries=0&noGst=1';

        notificationSchema.create({
            userID : interaction.user.id,
            channelID: interaction.channel.id,
            itemID: itemID,
            homeServer: homeServer,
            retainer: retainer,
            notified: false,
        });
        await interaction.reply('Tá salvo!');

        const data = notificationSchema.find({});
        console.log(data);
        /*
        async function fetchData() {
            try {
                const response = await axios.get(apiUrl);
                const data = response.data;
                await interaction.reply(JSON.stringify(data));
                console.log(data);
            }
            catch (error) {
                console.error('Error making API request:', error);
                await interaction.reply('Deu Ruim!');
            }
        }
        fetchData();
        */
	},
};
