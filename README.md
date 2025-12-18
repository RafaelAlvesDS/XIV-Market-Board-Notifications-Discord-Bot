# XIV Market Board Discord Bot

![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![Discord.js Version](https://img.shields.io/badge/discord.js-v14-blue)
![License](https://img.shields.io/badge/license-ISC-yellow)
![Status](https://img.shields.io/badge/status-active-success)

Um bot do Discord robusto e em tempo real para monitoramento do Market Board do Final Fantasy XIV. Utilizando a API do Universalis via WebSocket, este bot oferece notificações instantâneas sobre undercuts (preços menores) e vendas realizadas, ajudando jogadores a maximizarem seus lucros no jogo.

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Comandos](#-comandos)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## 🚀 Funcionalidades

- **📡 Monitoramento em Tempo Real**: Utiliza WebSockets para receber atualizações de mercado instantaneamente, sem delay de polling.
- **💰 Detecção de Vendas Inteligente**: Algoritmo híbrido que cruza dados de listagem com eventos de venda (`sales/add`) para confirmar vendas reais e evitar falsos positivos.
- **🛡️ Proteção contra Undercut**: Notifica imediatamente quando alguém lista um item por um preço menor que o seu.
  - *Lógica Inteligente*: Diferencia itens HQ (High Quality) de NQ, garantindo que você só seja notificado por competidores diretos.
- **📦 Gestão de Estoque**: Sincronização automática da quantidade de itens listados.
- **🔍 Autocomplete**: Integração com a base de dados do Teamcraft para busca rápida de itens e servidores.
- **👥 Múltiplos Retainers**: Suporte completo para monitorar vários retainers simultaneamente.

## 🏗 Arquitetura

O projeto é construído sobre uma arquitetura orientada a eventos:

1.  **Core**: Node.js com `discord.js` v14.
2.  **Dados**: MongoDB (via Mongoose) para persistência de preferências e estado dos usuários.
3.  **Comunicação Externa**:
    *   **WebSocket (`wss://universalis.app/api/ws`)**: Para fluxo de dados em tempo real (Listagens e Vendas).
    *   **REST API**: Para sincronização de estado inicial (Snapshot) e recuperação de falhas.
4.  **Resiliência**: Sistema de *Heartbeat* para manutenção de conexão e reconexão automática.

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

*   [Node.js](https://nodejs.org/) (v16.9.0 ou superior)
*   [MongoDB](https://www.mongodb.com/) (Local ou Atlas)
*   Uma aplicação criada no [Discord Developer Portal](https://discord.com/developers/applications)

## 🔧 Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/RafaelAlvesDS/FFXIV-Market-Board-Notifications.git
    cd FFXIV-Market-Board-Notifications
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Renomeie o arquivo `.env.example` para `.env` (ou crie um novo) e preencha:
    ```env
    DISCORD_TOKEN=seu_token_do_bot_aqui
    MONGODB_URI=mongodb://localhost:27017/ffxiv-market-bot
    CLIENT_ID=seu_client_id_do_discord
    GUILD_ID=id_do_servidor_de_teste (opcional)
    ```

4.  **Registre os comandos Slash:**
    ```bash
    node deploy-commands.js
    ```

5.  **Inicie o bot:**
    ```bash
    npm start
    ```

## ⚙️ Configuração

O bot baixa automaticamente a base de dados de itens do [FFXIV Teamcraft](https://github.com/ffxiv-teamcraft/ffxiv-teamcraft) na primeira inicialização.

Para forçar uma atualização manual dos itens:
```bash
node update-items.js
```

## 🎮 Uso

1.  Convide o bot para o seu servidor.
2.  Registre o nome do seu Retainer (vendedor no jogo).
3.  Adicione notificações para os itens que deseja monitorar.

### Comandos

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `/register-retainer` | Registra um retainer para o seu usuário. | `/register-retainer retainer:MyRetainer` |
| `/notify` | Cria um alerta de preço para um item. | `/notify item-id:Potion home-server:Behemoth retainer:MyRetainer` |
| `/list-notifications` | Exibe um painel com todos os seus alertas ativos. | `/list-notifications` |
| `/cancel-notification` | Remove o monitoramento de um item. | `/cancel-notification item-id:Potion retainer:MyRetainer` |

## 📂 Estrutura do Projeto

```
.
├── commands/           # Comandos Slash (Discord)
│   └── utility/        # Lógica dos comandos (notify, list, etc.)
├── events/             # Event Handlers
│   ├── interactionCreate.js # Processamento de comandos
│   └── ready.js        # Inicialização e Lógica WebSocket
├── schemas/            # Modelos do Mongoose (MongoDB)
├── itemsManager.js     # Gerenciamento de cache de itens (JSON)
├── socketManager.js    # Cliente WebSocket e Heartbeat
├── worldsManager.js    # Mapeamento de IDs de Mundos
├── index.js            # Ponto de entrada da aplicação
└── deploy-commands.js  # Script de registro de comandos
```

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, siga estes passos:

1.  Faça um Fork do projeto.
2.  Crie uma Branch para sua Feature (`git checkout -b feature/NovaFeature`).
3.  Commit suas mudanças (`git commit -m 'Adiciona NovaFeature'`).
4.  Push para a Branch (`git push origin feature/NovaFeature`).
5.  Abra um Pull Request.

### Padrões de Código

*   Utilizamos **ESLint** para manter a qualidade do código.
*   Siga o estilo de código assíncrono (`async/await`) preferencialmente.
*   Mantenha a lógica de negócios separada dos arquivos de visualização (comandos).

## 📄 Licença

Este projeto está licenciado sob a licença ISC. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Aviso Legal**: Este projeto não é afiliado à Square Enix. "Final Fantasy XIV" é uma marca registrada da Square Enix Co., Ltd.
