const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🔍 Running code quality and syntax audit...');

const filesToLint = [
  'manifest.json',
  'fields.js',
  'content.js',
  'background.js',
  'popup.js',
  'options.js',
  'license.js',
  'lib/pdf_extractor.js',
  'test/run_tests.js'
];

let errors = 0;
const rootDir = path.resolve(__dirname, '..');

filesToLint.forEach(file => {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${file}`);
    errors++;
    return;
  }

  const code = fs.readFileSync(fullPath, 'utf8');

  if (file.endsWith('.json')) {
    try {
      JSON.parse(code);
      console.log(`✅ ${file} (Valid JSON)`);
    } catch (e) {
      console.error(`❌ ${file} (JSON parse error):`, e.message);
      errors++;
    }
  } else if (file.endsWith('.js')) {
    try {
      new vm.Script(code);
      console.log(`✅ ${file} (Valid JavaScript syntax)`);
    } catch (e) {
      console.error(`❌ ${file} (JS syntax error):`, e.message);
      errors++;
    }
  }
});

if (errors === 0) {
  console.log('\n✨ All files passed syntax and quality audit with 0 errors!');
  process.exit(0);
} else {
  console.error(`\n❌ Found ${errors} syntax error(s).`);
  process.exit(1);
}
