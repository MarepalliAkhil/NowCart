const fs = require('fs');
const path = require('path');

function cleanEmoji(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Badge icon field replacements (productsData.ts and api.ts use same pattern)
  const badges = [
    [/icon:\s*'✨',\s*label:\s*'Picked just for your style',\s*color:\s*'[^']*'/g,   "type: 'style', label: 'Picked just for your style'"],
    [/icon:\s*'🔥',\s*label:\s*'Trending right now',\s*color:\s*'[^']*'/g,           "type: 'trending', label: 'Trending right now'"],
    [/icon:\s*'⭐',\s*label:\s*'People similar to you loved this',\s*color:\s*'[^']*'/g, "type: 'loved', label: 'People similar to you loved this'"],
    [/icon:\s*'👕',\s*label:\s*'You might love this piece',\s*color:\s*'[^']*'/g,    "type: 'new', label: 'You might love this piece'"],
    [/icon:\s*'👕',\s*label:\s*'Complete your outfit',\s*color:\s*'[^']*'/g,         "type: 'outfit', label: 'Complete your outfit'"],
    [/icon:\s*'🛍️',\s*label:\s*'Complements your recent picks',\s*color:\s*'[^']*'/g, "type: 'outfit', label: 'Complements your recent picks'"],
    // Catch any remaining icon: 'X' pattern with color field
    [/icon:\s*'[^']*',\s*label:\s*'([^']*)',\s*color:\s*'[^']*'/g, "type: 'style', label: '$1'"],
  ];

  for (const [pattern, replacement] of badges) {
    content = content.replace(pattern, replacement);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  } else {
    console.log('No changes:', filePath);
  }
}

const srcDir = path.join(__dirname, '..', 'src');
cleanEmoji(path.join(srcDir, 'data', 'productsData.ts'));
cleanEmoji(path.join(srcDir, 'services', 'api.ts'));

console.log('Badge icon fields replaced.');
