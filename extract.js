const fs = require('fs');
const html = fs.readFileSync('profile.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi)];
fs.writeFileSync('debug.js', scriptMatches[1][1]);
