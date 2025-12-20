const axios = require('axios');

class ItemCache {
    constructor() {
        this.items = new Map(); // ID -> Name
        this.names = new Map(); // Name -> ID
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            console.log('Baixando dados de itens do Teamcraft...');
            // URL oficial do dump de itens do Teamcraft (ou similar)
            // Usando uma fonte confiável de IDs do FFXIV
            const response = await axios.get('https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/libs/data/src/lib/json/items.json');
            
            const data = response.data;
            // O formato do JSON pode variar, assumindo { "id": { en: "Name" } } ou similar
            // Ajuste conforme a estrutura real do JSON do Teamcraft
            
            for (const [id, itemData] of Object.entries(data)) {
                const name = itemData.en; // Pegando nome em inglês
                if (name) {
                    this.items.set(parseInt(id), name);
                    this.names.set(name.toLowerCase(), parseInt(id));
                }
            }
            
            this.initialized = true;
            console.log(`Cache de itens carregado: ${this.items.size} itens.`);
        } catch (error) {
            console.error('Erro ao carregar cache de itens:', error);
        }
    }

    search(query) {
        if (!query) return [];
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        for (const [name, id] of this.names.entries()) {
            if (name.includes(lowerQuery)) {
                results.push({ name: this.items.get(id), value: id.toString() });
                if (results.length >= 25) break; // Limite do Discord
            }
        }
        return results;
    }

    getName(id) {
        return this.items.get(id);
    }

    getId(name) {
        return this.names.get(name.toLowerCase());
    }
}

module.exports = new ItemCache();
