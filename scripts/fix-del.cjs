const fs = require('fs');
const path = require('path');

const delPath = path.join(__dirname, '../node_modules/tempy/node_modules/del/index.js');

if (fs.existsSync(delPath)) {
  let content = fs.readFileSync(delPath, 'utf8');
  
  // Fix the rimraf promisify issue
  content = content.replace(
    /const rimrafP = promisify\(rimraf\);/,
    'const rimrafP = promisify(rimraf.rimraf || rimraf);'
  );
  
  // Fix the rimraf.sync issue
  content = content.replace(
    /rimraf\.sync\(file, rimrafOptions\);/,
    '(rimraf.rimrafSync || rimraf.sync)(file, rimrafOptions);'
  );
  
  fs.writeFileSync(delPath, content, 'utf8');
  console.log('✅ Fixed del package compatibility with Node.js 25');
} else {
  console.log('⚠️  del package not found, skipping fix');
}

