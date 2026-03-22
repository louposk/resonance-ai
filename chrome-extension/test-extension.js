// Extension validation script
// Run this in Node.js to validate the extension structure

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Resonance AI Chrome Extension...\n');

const requiredFiles = [
  'manifest.json',
  'background/service-worker.js',
  'background/api-client.js',
  'content/youtube-injector.js',
  'content/song-detector.js',
  'content/ui-components.js',
  'popup/popup.html',
  'popup/popup.css',
  'popup/popup.js',
  'assets/styles/content.css',
  'utils/helpers.js',
  'utils/cache.js',
  'README.md',
  'SETUP.md'
];

const requiredDirs = [
  'background',
  'content',
  'popup',
  'assets/styles',
  'assets/icons',
  'utils'
];

let allValid = true;

// Check directories
console.log('📁 Checking directories:');
for (const dir of requiredDirs) {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`  ✅ ${dir}/`);
  } else {
    console.log(`  ❌ ${dir}/ - MISSING`);
    allValid = false;
  }
}

console.log();

// Check files
console.log('📄 Checking required files:');
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allValid = false;
  }
}

console.log();

// Validate manifest.json
console.log('📋 Validating manifest.json:');
try {
  const manifestPath = path.join(__dirname, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const requiredManifestFields = [
    'manifest_version',
    'name',
    'version',
    'permissions',
    'host_permissions',
    'background',
    'content_scripts',
    'action'
  ];

  for (const field of requiredManifestFields) {
    if (manifest[field]) {
      console.log(`  ✅ ${field}`);
    } else {
      console.log(`  ❌ ${field} - MISSING`);
      allValid = false;
    }
  }

  // Check content script files exist
  if (manifest.content_scripts && manifest.content_scripts[0]) {
    const contentScript = manifest.content_scripts[0];
    console.log(`  📝 Content script files:`);
    for (const jsFile of contentScript.js || []) {
      const filePath = path.join(__dirname, jsFile);
      if (fs.existsSync(filePath)) {
        console.log(`    ✅ ${jsFile}`);
      } else {
        console.log(`    ❌ ${jsFile} - MISSING`);
        allValid = false;
      }
    }
    for (const cssFile of contentScript.css || []) {
      const filePath = path.join(__dirname, cssFile);
      if (fs.existsSync(filePath)) {
        console.log(`    ✅ ${cssFile}`);
      } else {
        console.log(`    ❌ ${cssFile} - MISSING`);
        allValid = false;
      }
    }
  }

} catch (error) {
  console.log(`  ❌ manifest.json - Invalid JSON: ${error.message}`);
  allValid = false;
}

console.log();

// Summary
if (allValid) {
  console.log('🎉 Extension validation successful!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Load the extension in Chrome (chrome://extensions/)');
  console.log('2. Configure your API key');
  console.log('3. Test on YouTube music videos');
  console.log('');
  console.log('See SETUP.md for detailed installation instructions.');
} else {
  console.log('❌ Extension validation failed!');
  console.log('Please fix the missing files/directories before loading the extension.');
}

console.log();

// File size summary
const totalSize = requiredFiles.reduce((total, file) => {
  const filePath = path.join(__dirname, file);
  try {
    const stats = fs.statSync(filePath);
    return total + stats.size;
  } catch {
    return total;
  }
}, 0);

console.log(`📊 Total extension size: ~${Math.round(totalSize / 1024)}KB`);
console.log(`📅 Validation completed: ${new Date().toLocaleString()}`);