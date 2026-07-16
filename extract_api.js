const fs = require('fs');
const path = require('path');

function parseMethods(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    const methods = [];
    const classRegex = /class\s+\w+/;
    if (!classRegex.test(code)) return methods;

    const lines = code.split('\n');
    let inComment = false;
    let comment = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        if (line.startsWith('/**')) {
            inComment = true;
            comment = [];
            continue;
        }
        if (inComment) {
            if (line.endsWith('*/')) {
                inComment = false;
            } else {
                comment.push(line.replace(/^\*\s*/, ''));
            }
            continue;
        }
        
        // Match method signatures: methodName(arg1, arg2) {
        const methodMatch = line.match(/^([a-zA-Z0-9_]+)\s*\((.*?)\)\s*\{/);
        if (methodMatch && methodMatch[1] !== 'constructor' && methodMatch[1] !== 'catch' && !['if','for','while','switch'].includes(methodMatch[1])) {
            methods.push({
                name: methodMatch[1],
                params: methodMatch[2],
                docs: comment.join(' ')
            });
            comment = [];
        } else if (line !== '') {
            comment = [];
        }
    }
    return methods;
}

const servicesDir = path.join(__dirname, 'src', 'services');
const services = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));
let out = '';
services.forEach(f => {
    out += '## ' + f.replace('.js', '') + '\n';
    const methods = parseMethods(path.join(servicesDir, f));
    methods.forEach(m => {
        out += '- ' + m.name + '(' + m.params + ') - ' + m.docs + '\n';
    });
    out += '\n';
});
fs.writeFileSync('services_raw.md', out);
console.log('Saved to services_raw.md');
