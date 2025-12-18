const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');

const version = packageJson.version || '0.0.0';
const now = new Date();
const buildTime = now.toISOString();
const buildTag = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
  String(now.getHours()).padStart(2, '0'),
  String(now.getMinutes()).padStart(2, '0'),
  String(now.getSeconds()).padStart(2, '0'),
].join('');

const versionInfo = {
  version: `${version}+${buildTag}`,
  buildTime,
};

const outputPath = path.join(__dirname, '..', 'src', 'assets', 'version.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2));

console.log('Updated version manifest:', versionInfo);
