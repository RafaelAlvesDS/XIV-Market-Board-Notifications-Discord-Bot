const WebSocket = require('ws');
const { deserialize, serialize } = require('bson');
const EventEmitter = require('events');

class UniversalisSocket extends EventEmitter {
    constructor() {
        super();
        this.url = 'wss://universalis.app/api/ws';
        this.ws = null;
        this.pingInterval = null;
        this.subscriptions = new Set(); // Set of channel strings
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
            console.log('Conectado ao WebSocket do Universalis.');
            this.startHeartbeat();
            this.resubscribeAll();
        });

        this.ws.on('close', () => {
            console.log('Conexão WebSocket fechada. Tentando reconectar em 5s...');
            this.stopHeartbeat();
            setTimeout(() => this.connect(), 5000);
        });

        this.ws.on('error', (err) => {
            console.error('Erro no WebSocket:', err);
        });

        this.ws.on('message', (data) => {
            try {
                const message = deserialize(data);
                this.handleMessage(message);
            } catch (err) {
                console.error('Erro ao deserializar mensagem:', err);
            }
        });
    }

    subscribe(channel) {
        if (this.subscriptions.has(channel)) return;
        
        this.subscriptions.add(channel);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(serialize({ event: 'subscribe', channel: channel }));
            console.log(`Inscrito no canal: ${channel}`);
        }
    }

    unsubscribe(channel) {
        if (!this.subscriptions.has(channel)) return;

        this.subscriptions.delete(channel);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(serialize({ event: 'unsubscribe', channel: channel }));
            console.log(`Desinscrito do canal: ${channel}`);
        }
    }

    resubscribeAll() {
        for (const channel of this.subscriptions) {
            this.ws.send(serialize({ event: 'subscribe', channel: channel }));
        }
    }

    startHeartbeat() {
        this.stopHeartbeat();
        // Envia um ping a cada 30 segundos para manter a conexão viva
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.ping();
            }
        }, 30000);
    }

    stopHeartbeat() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    handleMessage(message) {
        // message.event contém o canal, ex: 'listings/add'
        // message.item, message.world, message.listings, etc.
        
        if (message.event.startsWith('listings/add')) {
            this.emit('listingUpdate', message);
        } else if (message.event.startsWith('sales/add')) {
            this.emit('salesUpdate', message);
        }
    }
}

module.exports = new UniversalisSocket();
