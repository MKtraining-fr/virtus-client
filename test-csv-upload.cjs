const Papa = require('papaparse');
const fs = require('fs');

const csvContent = fs.readFileSync('/home/ubuntu/upload/exercices_pectoraux.csv', 'utf8');
const result = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

console.log('📊 Résultat du parsing:');
console.log('- Nombre de lignes:', result.data.length);
console.log('- En-têtes:', Object.keys(result.data[0]));
console.log('- Premier exercice:', result.data[0].name);
console.log('- Catégorie:', result.data[0].category);
console.log('- Erreurs:', result.errors.length);
