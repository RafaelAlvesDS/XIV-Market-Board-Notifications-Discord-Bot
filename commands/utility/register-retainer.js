const { SlashCommandBuilder } = require('discord.js');
const retainerSchema = require('../../schemas/retainers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('register-retainer')
		.setDescription('Register your retainer.')
        .addStringOption(option =>
			option.setName('retainer')
				.setDescription('The name of your retainer.')
				.setRequired(true)),
	async execute(interaction) {
        const retainer = interaction.options.getString('retainer').trim();
        try {
            const data = await retainerSchema.findOne({
                retainer: retainer,
            });

            if (!data) {
                retainerSchema.create({
                    userID : interaction.user.id,
                    retainerName: retainer,
                });
                await interaction.reply('Retainer registered!');
            }
            if (data) {
                console.log(data);
                await interaction.reply('Retainer already registered.');
            }
        }
        catch (error) {
            console.log(error);
        }

	},
};
