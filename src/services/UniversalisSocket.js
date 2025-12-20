const WebSocket = require('ws');
const { serialize, deserialize } = require('bson');
const EventEmitter = require('events');

class UniversalisSocket extends EventEmitter {
    constructor() {
        super();
        this.url = 'wss://universalis.app/api/ws';
        this.ws = null;
        this.reconnectInterval = 5000;
        this.subscribedWorlds = new Set();
        this.channels = ['listings/add', 'listings/remove', 'sales/add', 'sales/remove'];
        this.pingInterval = null;
        this.isAlive = false;
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
            console.log('Conectado ao WebSocket do Universalis.');
            this.resubscribe();
            this.startHeartbeat();
        });

        this.ws.on('pong', () => {
            this.isAlive = true;
        });

        this.ws.on('message', (data) => {
            try {
                const message = deserialize(data);
                this.emit('message', message);
            } catch (err) {
                console.error('Erro ao desserializar mensagem BSON:', err);
            }
        });

        this.ws.on('close', () => {
            console.log('Conexão WebSocket fechada. Tentando reconectar em 5s...');
            this.stopHeartbeat();
            setTimeout(() => this.connect(), this.reconnectInterval);
        });

        this.ws.on('error', (err) => {
            console.error('Erro no WebSocket:', err);
        });
    }

    startHeartbeat() {
        this.isAlive = true;
        // Envia um ping a cada 30 segundos para manter a conexão viva
        this.pingInterval = setInterval(() => {
            if (this.isAlive === false) {
                console.log('Sem resposta de PONG do servidor. Reiniciando conexão...');
                return this.ws.terminate();
            }

            this.isAlive = false;
            this.ws.ping();
        }, 30000);
    }

    stopHeartbeat() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    subscribeToWorlds(worldIds) {
        let newSubscriptions = false;
        for (const id of worldIds) {
            if (!this.subscribedWorlds.has(id)) {
                this.subscribedWorlds.add(id);
                newSubscriptions = true;
            }
        }

        if (newSubscriptions && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendSubscriptions(worldIds);
        }
    }

    sendSubscriptions(worldIds) {
        // Se worldIds for fornecido, inscreve apenas nesses.
        // Caso contrário, re-inscreve em todos os conhecidos (útil no reconnect).
        const targets = worldIds || Array.from(this.subscribedWorlds);
        
        if (targets.length === 0) return;

        console.log(`Inscrevendo em canais para ${targets.length} mundos...`);

        targets.forEach(worldId => {
            this.channels.forEach(channel => {
                const payload = {
                    event: 'subscribe',
                    channel: `${channel}{world=${worldId}}`
                };
                this.ws.send(serialize(payload));
            });
        });
    }

    resubscribe() {
        if (this.subscribedWorlds.size > 0) {
            this.sendSubscriptions();
        }
    }
}

module.exports = new UniversalisSocket();
