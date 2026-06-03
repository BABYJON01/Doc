const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\GHOST-PC\\.gemini\\antigravity\\brain\\48826f63-46bb-4fdc-b5e8-a36ed82e4a1b';
const destDir = 'C:\\Users\\GHOST-PC\\.gemini\\antigravity\\scratch\\Doc\\frontend\\public\\assets';

try {
  const f1 = path.join(srcDir, 'media__1780479151432.png');
  const d1 = path.join(destDir, 'student_bg.png');
  fs.copyFileSync(f1, d1);
  console.log('Copied student_bg.png');
  
  const f2 = path.join(srcDir, 'media__1780479391137.png');
  const d2 = path.join(destDir, 'teacher_bg.png');
  fs.copyFileSync(f2, d2);
  console.log('Copied teacher_bg.png');
} catch (err) {
  console.error('Error copying files:', err);
}
