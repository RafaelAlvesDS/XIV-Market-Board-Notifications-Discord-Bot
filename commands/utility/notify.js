const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

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
        // const retainer = interaction.options.getString('retainer');
        const apiUrl = 'https://universalis.app/api/v2/' + homeServer + '/' + itemID + '?listings=1&entries=0&noGst=1';
        axios.get(apiUrl)
            .then(response => {
                // Handle the JSON response here
                const data = response.data;
                console.log(data);
                interaction.reply(JSON.stringify(data));
            })
            .catch(error => {
                console.error('Error making API request:', error);
            });
		await interaction.reply('Mandei no privado');
	},
};
