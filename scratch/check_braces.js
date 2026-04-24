const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\goats\\Desktop\\HELLO projict\\src\\lib\\i18n.js', 'utf8');
let openBraces = 0;
let closeBraces = 0;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') openBraces++;
  if (content[i] === '}') closeBraces++;
}
console.log(`Open: ${openBraces}, Close: ${closeBraces}`);
