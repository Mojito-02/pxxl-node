'use strict';
// Downloads the official Xray-core Linux x64 release and unpacks it next to
// this file. Runs once at build time (npm run build) and again from
// server.js if the binary is missing. No third-party code is executed.
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION = 'v25.10.15';
const URL = `https://github.com/XTLS/Xray-core/releases/download/${VERSION}/Xray-linux-64.zip`;
const DIR = __dirname;
const BIN = path.join(DIR, 'xray');
const ZIP = path.join(DIR, 'xray.zip');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'pxxl-node-setup' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error('download HTTP ' + res.statusCode));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

(async () => {
  if (!fs.existsSync(BIN)) {
    await download(URL, ZIP);
    execSync('unzip -o -q xray.zip && chmod +x xray geoip.dat geosite.dat 2>/dev/null; rm -f xray.zip LICENSE README.md', { cwd: DIR, stdio: 'inherit' });
  }
  for (const f of ['xray', 'geoip.dat', 'geosite.dat']) {
    if (!fs.existsSync(path.join(DIR, f))) throw new Error('missing ' + f);
  }
  console.log('setup ok: xray-core ' + VERSION);
})().catch((e) => { console.error(e); process.exit(1); });
