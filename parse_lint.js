/* eslint-disable @typescript-eslint/no-require-imports */
 
const fs = require('fs');
const raw = fs.readFileSync(process.env.TEMP + '/eslint_output2.json', 'utf8');
const clean = raw.replace(/^\uFEFF/, '').trim();
const d = JSON.parse(clean);
const rules = {};
const filesByRule = {};
d.forEach(f => {
    f.messages.filter(m => m.severity === 2).forEach(m => {
        rules[m.ruleId] = (rules[m.ruleId] || 0) + 1;
        if (!filesByRule[m.ruleId]) filesByRule[m.ruleId] = {};
        const shortPath = f.filePath.replace(/^.*crab-khai[\\/]/, '');
        filesByRule[m.ruleId][shortPath] = (filesByRule[m.ruleId][shortPath] || 0) + 1;
    });
});
console.log('=== ERROR BREAKDOWN BY RULE ===');
Object.entries(rules).sort((a, b) => b[1] - a[1]).forEach(([r, c]) => console.log(c + ' ' + r));
const total = Object.values(rules).reduce((a, b) => a + b, 0);
console.log('\nTOTAL ERRORS: ' + total);
console.log('\n=== no-explicit-any BY FILE ===');
const anyFiles = filesByRule['@typescript-eslint/no-explicit-any'] || {};
Object.entries(anyFiles).sort((a, b) => b[1] - a[1]).forEach(([f, c]) => console.log(c + ' ' + f));
console.log('\n=== set-state-in-effect BY FILE ===');
const sseFiles = filesByRule['react-hooks/set-state-in-effect'] || {};
Object.entries(sseFiles).sort((a, b) => b[1] - a[1]).forEach(([f, c]) => console.log(c + ' ' + f));
