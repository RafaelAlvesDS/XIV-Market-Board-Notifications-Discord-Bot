const itemsManager = require('./itemsManager');

async function updateItems() {
    console.log('Iniciando atualização dos dados de itens...');
    await itemsManager.loadItems();
    console.log('Atualização concluída!');
    process.exit(0);
}

updateItems().catch(error => {
    console.error('Erro ao atualizar itens:', error);
    process.exit(1);
});
