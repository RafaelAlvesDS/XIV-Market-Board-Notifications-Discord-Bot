require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const ItemCache = require('./services/ItemCache');
const NotificationService = require('./services/NotificationService');
const UniversalisSocket = require('./services/UniversalisSocket');

// Configuração do Cliente Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] });
client.commands = new Collection();

// Carregar Comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[AVISO] O comando em ${filePath} está faltando "data" ou "execute".`);
    }
}

// Evento Ready
client.once(Events.ClientReady, async c => {
    console.log(`Pronto! Logado como ${c.user.tag}`);

    // 1. Conectar ao MongoDB
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB.');
    } catch (err) {
        console.error('Erro ao conectar ao MongoDB:', err);
        process.exit(1);
    }

    // 2. Inicializar Cache de Itens
    await ItemCache.initialize();

    // 3. Inicializar Serviço de Notificações e WebSocket
    NotificationService.init(client);
    UniversalisSocket.connect();

    // Registrar Slash Commands (Simplificado para dev - em prod usar script separado)
    const { REST, Routes } = require('discord.js');
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('Atualizando Slash Commands...');
        const commandsData = client.commands.map(c => c.data.toJSON());
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commandsData },
        );
        console.log('Slash Commands registrados.');
    } catch (error) {
        console.error(error);
    }
});

// Evento InteractionCreate
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Houve um erro ao executar este comando!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Houve um erro ao executar este comando!', ephemeral: true });
            }
        }
    } else if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
