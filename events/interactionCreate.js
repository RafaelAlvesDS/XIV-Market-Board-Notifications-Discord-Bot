const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;

        // Verificar se a interação já expirou (3 segundos)
        const now = Date.now();
        const created = interaction.createdTimestamp;
        if (now - created > 2500) {
            console.warn(`[Interaction] ${interaction.commandName} ignorada por timeout (${now - created}ms).`);
            return;
        }

		if (interaction.isChatInputCommand()) {
			// command handling
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			}
			catch (error) {
				console.error(`Error executing ${interaction.commandName}`);
				console.error(error);
			}
		}
		else if (interaction.isAutocomplete()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.autocomplete(interaction);
			}
			catch (error) {
				console.error(`Error executing ${interaction.commandName}`);
				console.error(error);
			}
		}

	},
};
