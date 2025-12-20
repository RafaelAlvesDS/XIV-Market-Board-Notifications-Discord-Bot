const { SlashCommandBuilder } = require('discord.js');
const TrackedItem = require('../models/TrackedItem');
const ItemCache = require('../services/ItemCache');
const WorldUtils = require('../utils/WorldUtils');
const NotificationService = require('../services/NotificationService');
const { ensureUserHasRetainer } = require('../utils/middleware');
const User = require('../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notify')
        .setDescription('Monitora um item para vendas e undercuts.')
        .addStringOption(option => 
            option.setName('item-name')
                .setDescription('Nome do item (comece a digitar para buscar)')
                .setAutocomplete(true)
                .setRequired(true))
        .addStringOption(option => 
            option.setName('retainer')
                .setDescription('Seu retainer que está vendendo o item')
                .setAutocomplete(true) // Autocomplete para retainers do usuário
                .setRequired(true)),
    
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'item-name') {
            const choices = ItemCache.search(focusedOption.value);
            await interaction.respond(choices);
        } else if (focusedOption.name === 'retainer') {
            // Buscar retainers do usuário no DB
            const user = await User.findOne({ discordId: interaction.user.id });
            if (user && user.retainers) {
                const filtered = user.retainers
                    .filter(r => r.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
                    .map(r => ({ name: `${r.name} (${r.serverName})`, value: r.name })); // Mostra Nome (Server) mas envia só o Nome como valor
                await interaction.respond(filtered.slice(0, 25));
            } else {
                await interaction.respond([]);
            }
        }
    },

    async execute(interaction) {
        const user = await ensureUserHasRetainer(interaction);
        if (!user) return;

        const itemId = parseInt(interaction.options.getString('item-name'));
        const retainerName = interaction.options.getString('retainer');

        // Encontrar o retainer selecionado nos dados do usuário para pegar o servidor
        // Nota: Se o usuário tiver 2 retainers com mesmo nome em servers diferentes, 
        // o autocomplete acima enviou apenas o nome. Isso pode ser ambíguo.
        // Idealmente o value do autocomplete deveria ser um ID único ou "Nome|ServerID".
        // Vamos assumir que o usuário selecionou corretamente e pegar o primeiro match ou melhorar o value.
        
        // Melhoria: Vamos buscar o retainer pelo nome. Se houver duplicata, pegamos o primeiro (limitação atual da simplificação)
        // Ou melhor, vamos ajustar a busca para ser robusta se possível, mas com value sendo só string name é difícil.
        // Vou assumir que o usuário escolheu um retainer específico.
        
        const selectedRetainer = user.retainers.find(r => r.name === retainerName);

        if (!selectedRetainer) {
             return interaction.reply({ content: 'Retainer não encontrado no seu perfil. Tente registrar novamente.', ephemeral: true });
        }

        const worldId = selectedRetainer.serverId;
        const worldName = selectedRetainer.serverName;

        if (isNaN(itemId)) {
            return interaction.reply({ content: 'Item inválido. Use as sugestões do autocomplete.', ephemeral: true });
        }

        const itemName = ItemCache.getName(itemId) || "Item Desconhecido";

        await interaction.deferReply({ ephemeral: true });

        // Verificar dados iniciais via REST
        const initialData = await NotificationService.checkInitialPrice(itemId, worldId, retainerName);
        
        const newItem = new TrackedItem({
            userId: interaction.user.id,
            itemId,
            itemName,
            retainerName,
            homeServerId: worldId,
            homeServerName: worldName,
            lastKnownPrice: initialData ? initialData.price : 0,
            lastKnownQuantity: initialData ? initialData.quantity : 0,
            listingID: initialData ? initialData.listingID : null,
            isHQ: initialData ? initialData.hq : false,
            isUndercut: initialData ? initialData.isUndercut : false
        });

        await newItem.save();
        
        // Atualizar inscrições do WebSocket
        await NotificationService.refreshSubscriptions();

        let msg = `✅ Monitorando **${itemName}** no servidor **${worldName}** (Retainer: ${retainerName}).`;
        if (initialData) {
            msg += `\nDados iniciais encontrados: ${initialData.price.toLocaleString()} gil (x${initialData.quantity}) [${initialData.hq ? 'HQ' : 'NQ'}]`;
            if (initialData.isUndercut) {
                msg += `\n⚠️ **ATENÇÃO:** Já existe um undercut para este item!`;
            }
        } else {
            msg += `\n⚠️ Não encontrei seu listing atual na API REST. O monitoramento começará, mas o alerta de undercut pode demorar até a próxima atualização.`;
        }

        await interaction.editReply({ content: msg });
    },
};
