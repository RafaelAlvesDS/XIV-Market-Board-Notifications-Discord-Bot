const { SlashCommandBuilder } = require('discord.js');
const mongoose = require('mongoose');
const TrackedItem = require('../models/TrackedItem');
const { ensureUserHasRetainer } = require('../utils/middleware');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cancel-notification')
        .setDescription('Para de monitorar um item.')
        .addStringOption(option => 
            option.setName('item-select')
                .setDescription('Selecione o item para remover')
                .setAutocomplete(true)
                .setRequired(true)),
    
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        // Buscar itens que o usuário já monitora
        const items = await TrackedItem.find({ userId: interaction.user.id });
        
        const filtered = items
            .filter(item => item.itemName.toLowerCase().includes(focusedValue.toLowerCase()))
            .map(item => ({
                name: `${item.itemName} - ${item.retainerName} (${item.homeServerName})`,
                value: item._id.toString() // Passando o ID do documento do Mongo
            }));

        await interaction.respond(filtered.slice(0, 25));
    },

    async execute(interaction) {
        const user = await ensureUserHasRetainer(interaction);
        if (!user) return;

        const trackingId = interaction.options.getString('item-select');

        if (!mongoose.isValidObjectId(trackingId)) {
            return interaction.reply({ content: '❌ ID de rastreamento inválido.', ephemeral: true });
        }

        try {
            const result = await TrackedItem.findOneAndDelete({ _id: trackingId, userId: interaction.user.id });
            
            if (result) {
                await interaction.reply({ content: `✅ Monitoramento removido para **${result.itemName}**.`, ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ Item não encontrado ou já removido.', ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Erro ao remover monitoramento.', ephemeral: true });
        }
    },
};
