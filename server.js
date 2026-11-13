'use strict';
// Minimal VLESS + WebSocket server on top of the official Xray-core binary.
// Configuration comes only from environment variables set on the platform:
//   UUID   (required) VLESS user id
//   WSPATH WebSocket path, default /api/v1/sync
//   PORT   listen port injected by the platform, default 8080
// TLS is terminated by the Pxxl edge (*.pxxlspace.cv:443); inside the
// container the traffic is plain WebSocket on $PORT.
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const crypto = require('crypto');

const uuid = process.env.UUID || process.env.APP_KEY;
const wsPath = process.env.WSPATH || process.env.API_ROUTE || '/api/v1/sync';
const port = parseInt(process.env.PORT || '8080', 10);
if (!uuid) { console.error('UUID env var is required'); process.exit(1); }

const DIR = __dirname;
const BIN = path.join(DIR, 'xray');
if (!fs.existsSync(BIN)) {
  try { execSync('node setup.js', { stdio: 'inherit', cwd: DIR }); }
  catch { process.exit(1); }
}

const cfg = {
  log: { loglevel: 'warning' },
  inbounds: [{
    listen: '0.0.0.0',
    port,
    protocol: 'vless',
    settings: { clients: [{ id: uuid }], decryption: 'none' },
    streamSettings: { network: 'ws', wsSettings: { path: wsPath } },
    sniffing: { enabled: true, destOverride: ['http', 'tls', 'quic'] }
  }],
  outbounds: [
    { protocol: 'freedom', tag: 'direct', settings: { domainStrategy: 'UseIPv4' } },
    { protocol: 'blackhole', tag: 'block' }
  ],
  routing: {
    domainStrategy: 'IPIfNonMatch',
    rules: [
      { type: 'field', outboundTag: 'block', protocol: ['bittorrent'] },
      { type: 'field', outboundTag: 'block', ip: ['geoip:private'] },
      { type: 'field', outboundTag: 'block', domain: ['geosite:private'] }
    ]
  },
  dns: { servers: ['https://1.1.1.1/dns-query', 'https://8.8.8.8/dns-query'], queryStrategy: 'UseIPv4' }
};

const cfgPath = path.join('/tmp', 'xray-' + crypto.randomBytes(4).toString('hex') + '.json');
fs.writeFileSync(cfgPath, JSON.stringify(cfg));
const child = spawn(BIN, ['run', '-c', cfgPath], { stdio: 'inherit', cwd: DIR });
child.on('exit', (code) => process.exit(code || 0));
process.on('SIGTERM', () => child.kill('SIGTERM'));
