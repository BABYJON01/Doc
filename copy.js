const fs = require('fs');
try {
  fs.copyFileSync('C:\\Users\\GHOST-PC\\.gemini\\antigravity\\brain\\48826f63-46bb-4fdc-b5e8-a36ed82e4a1b\\medical_bg_1780477723199.png', 'C:\\Users\\GHOST-PC\\.gemini\\antigravity\\scratch\\Doc\\frontend\\public\\assets\\medical_bg.png');
  console.log('Copied successfully!');
} catch (err) {
  console.error('Error:', err);
}
