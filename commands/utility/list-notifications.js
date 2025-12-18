const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const notificationSchema = require('../../schemas/notification');
const itemsManager = require('../../itemsManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list-notifications')
		.setDescription('List your notifications.'),
	async execute(interaction) {
        // Tenta deferir a resposta. Se falhar, loga e continua tentando editar (caso tenha funcionado mas retornado erro)
        try {
            await interaction.deferReply({ ephemeral: true });
        } catch (error) {
            if (error.code === 10062 || error.code === 40060) {
                // Interação desconhecida ou já respondida - abortar silenciosamente ou logar aviso
                console.warn(`[ListNotifications] Interação perdida ou já respondida: ${error.code}`);
                return;
            }
            console.error('Erro ao deferir (tentando continuar):', error.message);
        }

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
            console.error('Erro ao processar/editar resposta:', error);
            // Tenta enviar uma mensagem nova se editar falhar
            try {
                await interaction.followUp({ content: 'Ocorreu um erro ao listar suas notificações.', ephemeral: true });
            } catch (e) {
                console.error('Erro final ao enviar mensagem:', e.message);
            }
        }
	},
};
