const fs = require('fs');
const txt = fs.readFileSync('debug.js', 'utf8');
let opens = [];
let i = 0;
while (i < txt.length) {
    if (txt.substr(i, 2) === '/*') {
        i = txt.indexOf('*/', i) + 2;
        continue;
    }
    if (txt.substr(i, 2) === '//') {
        i = txt.indexOf('\n', i) + 1;
        if (i === 0) break;
        continue;
    }
    if (txt[i] === '\'') {
        i = txt.indexOf('\'', i + 1) + 1;
        continue;
    }
    if (txt[i] === '"') {
        let nxt = txt.indexOf('"', i + 1);
        if(nxt === -1) break;
        i = nxt + 1;
        continue;
    }
    if (txt[i] === '`') {
        let nxt = txt.indexOf('`', i + 1);
        if(nxt === -1) break;
        i = nxt + 1;
        continue;
    }
    if (txt[i] === '{') {
        opens.push(txt.substring(0, i).split('\n').length);
    }
    if (txt[i] === '}') {
        opens.pop();
    }
    i++;
}
console.log('Unclosed at line(s):', opens);
