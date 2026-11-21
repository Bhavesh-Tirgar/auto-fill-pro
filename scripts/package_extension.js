const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const outZip = path.resolve(rootDir, 'auto-fill-pro-v2.0.0.zip');
const distDir = path.resolve(rootDir, 'dist');

console.log('[Packager] Preparing Chrome Web Store package...');

// Remove existing dist/zip
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
if (fs.existsSync(outZip)) {
  fs.rmSync(outZip, { force: true });
}

fs.mkdirSync(distDir, { recursive: true });

// Extension assets to copy
const filesToCopy = [
  'manifest.json',
  'fields.js',
  'content.js',
  'background.js',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
  'license.js',
  'README.txt'
];

filesToCopy.forEach(f => {
  const src = path.join(rootDir, f);
  const dest = path.join(distDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${f}`);
  }
});

// Copy icons and lib
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(item => {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  });
}

copyDir(path.join(rootDir, 'icons'), path.join(distDir, 'icons'));
copyDir(path.join(rootDir, 'lib'), path.join(distDir, 'lib'));

// Create ZIP using PowerShell Compress-Archive
console.log(`Creating ZIP: ${outZip}...`);
execSync(`powershell.exe -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${outZip}' -Force"`, { stdio: 'inherit' });

if (fs.existsSync(outZip)) {
  const stats = fs.statSync(outZip);
  console.log(`✅ Success! Chrome Web Store package created: ${outZip} (${Math.round(stats.size / 1024)} KB)`);
} else {
  console.error('❌ Failed to create zip package.');
  process.exit(1);
}
