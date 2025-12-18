const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ItemsManager {
    constructor() {
        this.items = {};
        this.itemsArray = [];
        this.jsonPath = path.join(__dirname, 'items.json');
        this.apiUrl = 'https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/libs/data/src/lib/json/items.json';
        this.loadingPromise = null;
    }

    async loadItems() {
        if (this.itemsArray.length > 0) {
            console.log('Itens já carregados.');
            return;
        }

        if (this.loadingPromise) {
            console.log('Aguardando carregamento de itens em andamento...');
            return this.loadingPromise;
        }

        this.loadingPromise = (async () => {
            try {
                console.log('Carregando dados de itens...');

                // Primeiro tenta baixar do GitHub
                await this.downloadItems();

                // Se não conseguir baixar, tenta carregar do arquivo local
                if (!fs.existsSync(this.jsonPath)) {
                    console.warn('Arquivo items.json não encontrado. Criando arquivo vazio...');
                    fs.writeFileSync(this.jsonPath, '{}');
                    this.items = {};
                    this.itemsArray = [];
                    return;
                }

                // Carrega os dados do arquivo de forma assíncrona
                const data = await fs.promises.readFile(this.jsonPath, 'utf8');
                this.items = JSON.parse(data);

                // Converte para array para facilitar o uso no autocomplete
                this.itemsArray = Object.keys(this.items).map(id => ({
                    id: parseInt(id),
                    en: this.items[id]?.en || `Item ${id}`,
                })).filter(item => item.en && item.en !== '');

                console.log(`${this.itemsArray.length} itens carregados com sucesso!`);
            }
            catch (error) {
                console.error('Erro ao carregar itens:', error);
                this.items = {};
                this.itemsArray = [];
            } finally {
                this.loadingPromise = null;
            }
        })();

        return this.loadingPromise;
    }

    async downloadItems() {
        try {
            console.log('Baixando dados de itens do GitHub...');
            const response = await axios.get(this.apiUrl, {
                timeout: 30000,
            });

            fs.writeFileSync(this.jsonPath, JSON.stringify(response.data, null, 2));
            console.log('Dados de itens baixados e salvos com sucesso!');
        }
        catch (error) {
            console.warn('Não foi possível baixar os dados de itens do GitHub:', error.message);

            // Se existir um arquivo local, usa ele
            if (fs.existsSync(this.jsonPath)) {
                console.log('Usando dados de itens do arquivo local...');
            }
        }
    }

    getItemById(id) {
        const itemId = parseInt(id);
        return this.items[itemId] || null;
    }

    getItemName(id) {
        const item = this.getItemById(id);
        return item?.en || `Item ${id}`;
    }

    getAllItems() {
        return this.itemsArray;
    }

    searchItems(query, limit = 25) {
        return this.itemsArray
            .filter(item => item.en.toLowerCase().includes(query.toLowerCase()))
            .slice(0, limit);
    }
}

// Singleton instance
const itemsManager = new ItemsManager();

module.exports = itemsManager;
