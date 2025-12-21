const { SlashCommandBuilder } = require('discord.js');
const User = require('../models/User');
const WorldUtils = require('../utils/WorldUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register-retainer')
        .setDescription('Registra um nome de retainer e seu servidor para monitoramento.')
        .addStringOption(option => 
            option.setName('name')
                .setDescription('Nome do Retainer')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('home-server')
                .setDescription('Servidor do Retainer')
                .setAutocomplete(true)
                .setRequired(true)),
    
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === 'home-server') {
            const choices = WorldUtils.search(focusedOption.value);
            await interaction.respond(choices);
        }
    },

    async execute(interaction) {
        const retainerName = interaction.options.getString('name');
        const serverId = parseInt(interaction.options.getString('home-server'));
        const discordId = interaction.user.id;

        // Validação de segurança do nome do Retainer (evitar caracteres especiais e nomes muito longos)
        const nameRegex = /^[a-zA-Z0-9' -]{2,20}$/;
        if (!nameRegex.test(retainerName)) {
            return interaction.reply({ 
                content: 'Nome de retainer inválido. Use apenas letras, números, espaços, apóstrofos e hífens (2-20 caracteres).', 
                ephemeral: true 
            });
        }

        if (isNaN(serverId)) {
            return interaction.reply({ content: 'Servidor inválido. Use as sugestões do autocomplete.', ephemeral: true });
        }

        const serverName = WorldUtils.getName(serverId);

        try {
            let user = await User.findOne({ discordId });
            
            const newRetainer = { name: retainerName, serverId, serverName };

            if (!user) {
                user = new User({ discordId, retainers: [newRetainer] });
            } else {
                // Verifica se já existe um retainer com esse nome (independente do servidor, ou no mesmo? 
                // Geralmente nome é único por servidor, mas vamos simplificar e checar nome apenas ou nome+server)
                const exists = user.retainers.some(r => r.name.toLowerCase() === retainerName.toLowerCase() && r.serverId === serverId);
                
                if (!exists) {
                    user.retainers.push(newRetainer);
                } else {
                    return interaction.reply({ content: `O retainer **${retainerName}** no servidor **${serverName}** já está registrado.`, ephemeral: true });
                }
            }

            await user.save();
            await interaction.reply({ content: `✅ Retainer **${retainerName}** (${serverName}) registrado com sucesso!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Erro ao registrar retainer.', ephemeral: true });
        }
    },
};
