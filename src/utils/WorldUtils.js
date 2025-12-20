// Mapa simplificado de Mundos (Worlds) para IDs
// Em produção, isso poderia vir de uma API externa também (ex: https://universalis.app/api/v2/worlds)
const worlds = {
    "Adamantoise": 73,
    "Cactuar": 79,
    "Faerie": 54,
    "Gilgamesh": 63,
    "Jenova": 40,
    "Midgardsormr": 65,
    "Sargatanas": 99,
    "Siren": 57,
    "Behemoth": 78,
    "Excalibur": 93,
    "Hyperion": 95,
    "Lamia": 53,
    "Leviathan": 33,
    "Ultros": 77,
    "Famfrit": 35,
    // ... Adicionar outros mundos conforme necessário
};

const worldNames = Object.fromEntries(Object.entries(worlds).map(([k, v]) => [v, k]));

module.exports = {
    getId: (name) => {
        const n = Object.keys(worlds).find(k => k.toLowerCase() === name.toLowerCase());
        return n ? worlds[n] : null;
    },
    getName: (id) => worldNames[id] || "Unknown",
    search: (query) => {
        const lower = query.toLowerCase();
        return Object.keys(worlds)
            .filter(w => w.toLowerCase().includes(lower))
            .map(w => ({ name: w, value: worlds[w].toString() }))
            .slice(0, 25);
    }
};
