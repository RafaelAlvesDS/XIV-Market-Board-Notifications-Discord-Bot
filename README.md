# FFXIV Market Monitor Bot

Bot de Discord para monitoramento de mercado do Final Fantasy XIV utilizando a API WebSocket do Universalis.

## Funcionalidades

*   **Monitoramento em Tempo Real:** Utiliza WebSocket para receber atualizações instantâneas de listagens e vendas.
*   **Filtros Inteligentes:** Inscreve-se apenas nos canais dos mundos relevantes para economizar banda.
*   **Detecção de Undercut:** Notifica via DM quando um concorrente posta um preço menor (considerando HQ/NQ).
*   **Alerta de Vendas:** Notifica quando um item monitorado é vendido (baseado em match de preço/quantidade).
*   **Slash Commands:** Interface amigável com Autocomplete para itens e mundos.

## Pré-requisitos

*   Node.js v16.9.0 ou superior.
*   MongoDB (local ou Atlas).
*   Token de Bot do Discord.

## Instalação

1.  Clone o repositório.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure o arquivo `.env` (use `.env.example` como base):
    ```env
    DISCORD_TOKEN=seu_token_aqui
    CLIENT_ID=seu_client_id_aqui
    MONGODB_URI=mongodb://localhost:27017/ffxiv-market
    ```

## Execução

Para desenvolvimento (com auto-reload):
```bash
npm run dev
```

Para produção:
```bash
npm start
```

## Comandos do Bot

*   `/register-retainer [name]`: Registra o nome do seu retainer. Obrigatório para usar os outros comandos.
*   `/notify [item] [retainer] [server]`: Começa a monitorar um item.
*   `/list-notifications`: Lista seus itens monitorados.
*   `/cancel-notification [item]`: Para de monitorar um item.

## Arquitetura

*   **src/services/UniversalisSocket.js**: Gerencia a conexão WebSocket e deserialização BSON.
*   **src/services/NotificationService.js**: Processa as mensagens recebidas e decide quem notificar.
*   **src/models**: Schemas do Mongoose (User, TrackedItem).
*   **src/commands**: Implementação dos Slash Commands.
