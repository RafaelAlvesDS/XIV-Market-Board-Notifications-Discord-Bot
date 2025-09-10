# XIV Market Board Discord Bot

Um bot do Discord para notificações do Market Board do XIV. Este bot monitora preços de itens no Market Board e notifica os usuários quando alguém oferece um preço mais baixo que o seu ou quando seus itens são vendidos.

## 🎯 Funcionalidades

- **Notificações de Preços**: Receba alertas quando alguém colocar um item mais barato que o seu
- **Notificações de Vendas**: Seja notificado quando seus itens forem vendidos
- **Autocompletar**: Interface amigável com autocompletar para itens, servidores e retainers
- **Múltiplos Retainers**: Suporte para múltiplos retainers por usuário
- **Monitoramento Automático**: Verificação automática a cada 5 minutos
- **Dados Atualizados**: Downloads automáticos da base de dados de itens mais recente do Teamcraft

## 📋 Comandos Disponíveis

### `/notify`
Configura uma notificação para um item específico.

**Parâmetros:**
- `item-id`: ID do item (com autocompletar)
- `retainer`: Nome do retainer que está vendendo o item
- `home-server`: Servidor home (ex: Behemoth)

**Exemplo:** `/notify item-id:Savage Aim Materia X retainer:MeuRetainer home-server:Behemoth`

### `/cancel-notification`
Cancela uma notificação específica.

**Parâmetros:**
- `item-id`: ID do item para cancelar
- `retainer`: Nome do retainer

### `/list-notifications`
Lista todas as suas notificações ativas.

### `/register-retainer`
Registra um novo retainer.

**Parâmetros:**
- `retainer`: Nome do retainer a ser registrado

## 🛠️ Configuração e Instalação

### Pré-requisitos

- Node.js 16.0.0 ou superior
- MongoDB
- Token do bot do Discord
- Conexão com a API do Universalis

### Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/RafaelAlvesDS/FFXIV-Market-Board-Notifications.git
cd FFXIV-Market-Board-Notifications
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
Crie um arquivo `.env` na raiz do projeto:
```env
DISCORD_TOKEN=seu_token_do_discord_aqui
MONGODB_URI=sua_string_de_conexao_mongodb_aqui
```

4. **Configure o banco de dados:**
Certifique-se de que o MongoDB está rodando e acessível através da URI configurada.

5. **Deploy dos comandos:**
```bash
node deploy-commands.js
```

6. **Inicie o bot:**
```bash
node index.js
```
ou use o arquivo batch:
```bash
"RUN BOT.bat"
```

### Atualização Manual dos Dados de Itens

Para atualizar manualmente a base de dados de itens:
```bash
node update-items.js
```

> **Nota**: Os dados de itens são baixados automaticamente quando o bot inicia. O comando acima é apenas para atualizações manuais.

### Estrutura do Projeto

```
├── commands/
│   ├── fun/                    # Comandos de diversão
│   └── utility/                # Comandos utilitários
│       ├── notify.js          # Comando principal de notificação
│       ├── cancel-notification.js
│       ├── list-notifications.js
│       └── register-retainer.js
├── events/
│   ├── interactionCreate.js   # Manipula interações
│   └── ready.js              # Lógica de monitoramento
├── schemas/
│   ├── notification.js       # Schema das notificações
│   ├── retainers.js         # Schema dos retainers
│   └── listing.js           # Schema das listagens
├── config.json              # Configurações do bot
├── itemsManager.js          # Gerenciador da base de dados de itens
├── items.json              # Cache local dos dados de itens
├── update-items.js         # Script para atualização manual dos itens
└── package.json
```

## 🔧 Dependências

### Principais
- **discord.js** (^14.13.0): Biblioteca principal para interação com o Discord
- **mongoose** (^7.4.4): ODM para MongoDB
- **axios** (^1.4.0): Cliente HTTP para requisições à API
- **dotenv** (^16.3.1): Carregamento de variáveis de ambiente

### Desenvolvimento
- **eslint** (^8.47.0): Linting do código

## 📊 Funcionamento

1. **Inicialização**: O bot baixa automaticamente a base de dados de itens mais recente do [Teamcraft](https://github.com/ffxiv-teamcraft/ffxiv-teamcraft)
2. **Registro**: Usuários registram seus retainers usando `/register-retainer`
3. **Configuração**: Usuários configuram notificações com `/notify`
4. **Monitoramento**: O bot verifica a API do Universalis a cada 5 minutos
5. **Notificações**: O bot envia mensagens quando:
   - Alguém lista um item mais barato
   - Um item é vendido
   - Novos itens são adicionados ao mercado

## 🌐 APIs Externas

Este bot utiliza as seguintes APIs:

### Universalis API
Para obter dados do Market Board do XIV market:
```
https://universalis.app/api/v2/{servidor}/{itemID}?&entries=0&noGst=1
```

### Teamcraft
Para obter a base de dados de itens atualizada:
```
https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/libs/data/src/lib/json/items.json
```

## 📝 Schemas do Banco de Dados

### Notification
```javascript
{
    userID: String,      // ID do usuário do Discord
    channelID: String,   // ID do canal para notificações
    itemID: String,      // ID do item no jogo
    homeServer: String,  // Servidor do usuário
    retainer: String,    // Nome do retainer
    notified: Boolean,   // Status da notificação
    listings: Number     // Número atual de listagens
}
```

### Retainer
```javascript
{
    userID: String,      // ID do usuário do Discord
    retainerName: String // Nome do retainer
}
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença ISC - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👤 Autor

**FaelRocker**
- GitHub: [@RafaelAlvesDS](https://github.com/RafaelAlvesDS)

## 🐛 Reportar Bugs

Se você encontrar algum bug, por favor abra uma [issue](https://github.com/RafaelAlvesDS/FFXIV-Market-Board-Notifications/issues) no GitHub.

## 📈 Status do Projeto

Este projeto está em desenvolvimento ativo. Novas funcionalidades e melhorias são adicionadas regularmente.

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!
