const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const TrackedItem = require('../models/TrackedItem');
const { ensureUserHasRetainer } = require('../utils/middleware');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-notifications')
        .setDescription('Lista todos os itens que você está monitorando.'),
    async execute(interaction) {
        const user = await ensureUserHasRetainer(interaction);
        if (!user) return;

        const items = await TrackedItem.find({ userId: interaction.user.id });

        if (items.length === 0) {
            return interaction.reply({ content: 'Você não está monitorando nenhum item.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('📋 Itens Monitorados')
            .setColor(0x0099FF);

        items.forEach(item => {
            const statusIcon = item.isUndercut ? '⚠️ **UNDERCUT**' : '✅ Menor Preço';
            
            embed.addFields({
                name: `${item.itemName} (${item.homeServerName})`,
                value: `Status: ${statusIcon}\nRetainer: ${item.retainerName}\nPreço: ${item.lastKnownPrice.toLocaleString()} gil\nQtd: ${item.lastKnownQuantity}\nQualidade: ${item.isHQ ? 'HQ' : 'NQ'}`,
                inline: true
            });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
