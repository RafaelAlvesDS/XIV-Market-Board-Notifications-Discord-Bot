const axios = require('axios');

class WorldsManager {
    constructor() {
        this.worlds = {}; // Map: ID -> Name
        this.worldsByName = {}; // Map: Name -> ID
        this.apiUrl = 'https://universalis.app/api/v2/worlds';
    }

    async loadWorlds() {
        try {
            console.log('Carregando lista de mundos...');
            const response = await axios.get(this.apiUrl);
            const data = response.data;

            data.forEach(world => {
                this.worlds[world.id] = world.name;
                this.worldsByName[world.name] = world.id;
            });

            console.log(`${Object.keys(this.worlds).length} mundos carregados.`);
        } catch (error) {
            console.error('Erro ao carregar mundos:', error);
        }
    }

    getIdByName(name) {
        // Case insensitive search if direct match fails
        if (this.worldsByName[name]) return this.worldsByName[name];
        
        const lowerName = name.toLowerCase();
        const key = Object.keys(this.worldsByName).find(k => k.toLowerCase() === lowerName);
        return key ? this.worldsByName[key] : null;
    }

    getNameById(id) {
        return this.worlds[id];
    }
}

module.exports = new WorldsManager();
