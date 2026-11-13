# pxxl-node

Minimal VLESS + WebSocket node for **Pxxl Free** (GitHub-repo Node deploy, no card).
TLS is terminated by the Pxxl edge on `*.pxxlspace.cv:443`; the container runs the
official [Xray-core](https://github.com/XTLS/Xray-core) binary (downloaded at build
time by `setup.js`) listening on `$PORT` with plain WebSocket.

## Deploy

1. Push this repo to GitHub.
2. Sign in to [app.pxxl.app](https://app.pxxl.app) with GitHub OAuth and install the
   Pxxl GitHub App on this repository only.
3. Create a project from this repo. Language must be detected as **Node**
   (build: `npm run build`, start: `npm start`). Do not choose Docker on Free.
4. Set environment variables (never commit real values):
   - `UUID` — a fresh UUIDv4 (required)
   - `WSPATH` — WebSocket path starting with `/`
5. Wait for **Deployed**, then build the client link:

```
vless://<UUID>@<app>.pxxlspace.cv:443?encryption=none&security=tls&type=ws&host=<app>.pxxlspace.cv&sni=<app>.pxxlspace.cv&path=<url-encoded WSPATH>#Pxxl-Paris
```

Private-IP and BitTorrent traffic are blocked in the routing rules on purpose.
