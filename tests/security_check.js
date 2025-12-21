
const { performance } = require('perf_hooks');

// 1. Teste de Performance do ItemCache (Simulação de DoS)
console.log('--- Teste de Performance do ItemCache ---');
const items = new Map();
const names = new Map();
const TOTAL_ITEMS = 40000; // Aproximação do número de itens no FFXIV

// Popula com dados falsos
for (let i = 0; i < TOTAL_ITEMS; i++) {
    const name = `Item Name ${i} with some extra text to make it longer`;
    items.set(i, name);
    names.set(name.toLowerCase(), i);
}

function search(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];
    let iterations = 0;
    
    for (const [name, id] of names.entries()) {
        iterations++;
        if (name.includes(lowerQuery)) {
            results.push({ name: items.get(id), value: id.toString() });
            if (results.length >= 25) break;
        }
    }
    return { results, iterations };
}

const query = "zzzzzzzzzzzz"; // String que não existe
const start = performance.now();
const { iterations } = search(query);
const end = performance.now();

console.log(`Busca por string inexistente em ${TOTAL_ITEMS} itens.`);
console.log(`Tempo: ${(end - start).toFixed(4)}ms`);
console.log(`Iterações: ${iterations}`);

if ((end - start) > 100) {
    console.log('⚠️ ALERTA: A busca demorou mais de 100ms. Risco de bloqueio do Event Loop.');
} else {
    console.log('✅ Performance aceitável.');
}

// 2. Teste de ReDoS no Regex de Retainer
console.log('\n--- Teste de ReDoS (Regex) ---');
const nameRegex = /^[a-zA-Z0-9' -]{2,20}$/;
const safeInput = "My Retainer";
const attackInput = "A".repeat(10000); // Input longo

const startRegex = performance.now();
nameRegex.test(safeInput);
const endRegex = performance.now();
console.log(`Input seguro: ${(endRegex - startRegex).toFixed(4)}ms`);

const startAttack = performance.now();
nameRegex.test(attackInput);
const endAttack = performance.now();
console.log(`Input longo (ataque): ${(endAttack - startAttack).toFixed(4)}ms`);

if ((endAttack - startAttack) > 10) {
    console.log('⚠️ ALERTA: Regex pode estar vulnerável a ReDoS ou input muito longo.');
} else {
    console.log('✅ Regex seguro.');
}

// 3. Verificação de Tratamento de Erros Global (Simulação)
console.log('\n--- Verificação de Tratamento de Erros ---');
// Apenas verificando se existem listeners no código (análise estática simulada)
const fs = require('fs');
const path = require('path');

try {
    const indexContent = fs.readFileSync(path.join(__dirname, '../src/index.js'), 'utf8');
    if (indexContent.includes('process.on(\'unhandledRejection\'') || indexContent.includes('process.on(\'uncaughtException\'')) {
        console.log('✅ Handlers globais de erro encontrados (análise estática).');
    } else {
        console.log('⚠️ ALERTA: Handlers globais de erro (unhandledRejection/uncaughtException) NÃO encontrados em index.js.');
    }
} catch (e) {
    console.log('Erro ao ler index.js: ' + e.message);
}
