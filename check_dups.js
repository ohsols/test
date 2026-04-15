const fs = require('fs');
const content = fs.readFileSync('gameData.ts', 'utf-8');
const matches = [...content.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
const duplicates = matches.filter((item, index) => matches.indexOf(item) !== index);
console.log([...new Set(duplicates)]);
