const itemsManager = require('./itemsManager');

async function testItemsManager() {
    console.log('🔄 Testando o ItemsManager...\n');

    // Carrega os itens
    await itemsManager.loadItems();

    // Testa algumas funções
    console.log('📊 Estatísticas:');
    console.log(`   Total de itens: ${itemsManager.getAllItems().length}`);

    console.log('\n🔍 Teste de busca por ID:');
    const testIds = ['5', '6533', '7862'];
    testIds.forEach(id => {
        const itemName = itemsManager.getItemName(id);
        console.log(`   ID ${id}: ${itemName}`);
    });

    console.log('\n🔎 Teste de pesquisa:');
    const searchResults = itemsManager.searchItems('potion', 5);
    console.log('   Resultados para "potion":');
    searchResults.forEach(item => {
        console.log(`   - ${item.en} (ID: ${item.id})`);
    });

    console.log('\n✅ Teste concluído!');
}

testItemsManager().catch(console.error);
