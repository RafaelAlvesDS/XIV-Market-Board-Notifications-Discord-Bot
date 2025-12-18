const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const notificationSchema = require('../../schemas/notification');
const itemsManager = require('../../itemsManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list-notifications')
		.setDescription('List your notifications.'),
	async execute(interaction) {
        // Deferir a resposta para evitar timeout (Unknown interaction)
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const data = await notificationSchema.find({
                userID: interaction.user.id,
            });

            if (data.length === 0) {
                return await interaction.editReply({ 
                    content: 'Você não tem nenhuma notificação ativa.'
                });
            }

            // Agrupar por Retainer
            const grouped = {};
            data.forEach(item => {
                const key = `${item.retainer} (${item.homeServer})`;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(item);
            });

            const embed = new EmbedBuilder()
                .setTitle('📋 Suas Notificações Ativas')
                .setColor(0x0099FF)
                .setTimestamp()
                .setFooter({ text: `Total de itens monitorados: ${data.length}` });

            let description = '';
            
            for (const [retainerInfo, items] of Object.entries(grouped)) {
                description += `**👤 ${retainerInfo}**\n`;
                items.forEach(item => {
                    const itemName = itemsManager.getItemName(item.itemID);
                    const status = item.notified ? '⚠️ Undercut!' : '✅ OK';
                    description += `> [${itemName}](https://universalis.app/market/${item.itemID}) • 📦 ${item.listings} • ${status}\n`;
                });
                description += '\n';
            }

            // Proteção simples contra limite de caracteres do Discord (4096)
            if (description.length > 4096) {
                description = description.substring(0, 4093) + '...';
            }

            embed.setDescription(description);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Ocorreu um erro ao buscar suas notificações.' });
        }
	},
};
