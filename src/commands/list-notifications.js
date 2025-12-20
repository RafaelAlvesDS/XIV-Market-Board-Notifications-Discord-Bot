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
            .setTitle('� Painel de Monitoramento')
            .setDescription(`Você está monitorando **${items.length}** itens.`)
            .setColor(0x2B2D31)
            .setTimestamp()
            .setFooter({ text: 'FFXIV Market Bot', iconURL: interaction.client.user.displayAvatarURL() });

        items.forEach(item => {
            const status = item.isUndercut 
                ? '🔴 **UNDERCUT DETECTADO**' 
                : '🟢 **Melhor Preço**';
            
            const quality = item.isHQ ? '✨ HQ' : 'Normal';
            
            embed.addFields({
                name: `🔹 ${item.itemName}`,
                value: `> 🌍 **${item.homeServerName}** | 👤 **${item.retainerName}**\n> 💰 **${item.lastKnownPrice.toLocaleString()} gil** (${quality})\n> 📦 Estoque: ${item.lastKnownQuantity}\n> ${status}`,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
