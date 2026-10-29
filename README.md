# XIV Market Board Notifications

Bot de Discord que avisa por DM quando alguém baixa o preço do seu item no Market Board do Final Fantasy XIV, ou quando o item vende. Os dados vêm do WebSocket do [Universalis](https://universalis.app), então o aviso chega em tempo real, sem ficar consultando a API.

## O que ele faz

- **Undercut.** Se outro vendedor lista o mesmo item por menos que você, ele manda DM com o menor preço. Se o seu item é HQ, listagens NQ são ignoradas.
- **Venda.** Avisa quando uma venda bate com o preço e a quantidade da sua listagem.
- **Só o que importa.** Assina os canais do Universalis apenas dos mundos que alguém está monitorando.

## Comandos

- `/register-retainer nome`: registra o nome do seu retainer. Precisa ser feito antes dos outros comandos.
- `/notify item retainer servidor`: começa a monitorar um item. Item e mundo têm autocomplete.
- `/list-notifications`: lista o que você está monitorando.
- `/cancel-notification item`: para de monitorar.

## Rodar

Precisa de Node 16.9 ou mais novo, um MongoDB (local ou Atlas) e um bot criado no Discord Developer Portal.

```
npm install
```

Crie um `.env`:

```
DISCORD_TOKEN=
CLIENT_ID=
MONGODB_URI=mongodb://localhost:27017/ffxiv-market
```

Depois `npm start`, ou `npm run dev` para reiniciar sozinho a cada alteração.

## Código

- `src/services/UniversalisSocket.js`: conexão WebSocket e leitura das mensagens em BSON.
- `src/services/NotificationService.js`: decide quem avisar a cada mensagem.
- `src/services/ItemCache.js`: nomes de itens para o autocomplete.
- `src/models/`: `User` e `TrackedItem`, com Mongoose.
- `src/commands/`: os slash commands.
- `swagger.yaml`: anotações do formato das mensagens do WebSocket do Universalis, que não tem documentação oficial.
- `tests/security_check.js`: script que mede o custo da busca por nome com 40 mil itens falsos.
