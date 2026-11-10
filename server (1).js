// Servidor do Legião Alvorada: serve o jogo e gerencia salas online (sem cadastro).
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 3000, PUB = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const srv = http.createServer((req, res) => {
  let u = '/';
  try { u = decodeURIComponent((req.url || '/').split('?')[0]); } catch (e) {}
  if (u.endsWith('/')) u += 'index.html';
  const f = path.normalize(path.join(PUB, u));
  if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(d);
  });
});

const wss = new WebSocketServer({ server: srv, maxPayload: 64 * 1024 });
const rooms = new Map(); // codigo -> { code, slots: [host, p2, p3, p4], st }
const LET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const send = (w, o) => { if (w && w.readyState === 1) w.send(JSON.stringify(o)); };
const num = v => (typeof v === 'number' && isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0);
const newCode = () => { let c; do { c = [...Array(4)].map(() => LET[Math.random() * LET.length | 0]).join(''); } while (rooms.has(c)); return c; };

function leave(w) {
  const r = w.room; if (!r) return;
  w.room = null; r.slots[w.slot] = null;
  if (w.slot === 0) {
    r.slots.forEach(c => { if (c) { c.room = null; send(c, { t: 'hostleft' }); } });
    rooms.delete(r.code);
  } else {
    r.slots.forEach(c => send(c, { t: 'peer', id: w.slot, on: 0 }));
    if (!r.slots.some(Boolean)) rooms.delete(r.code);
  }
}
function create(w) {
  const code = newCode(), r = { code, slots: [w, null, null, null], st: 'lobby' };
  rooms.set(code, r); w.room = r; w.slot = 0;
  send(w, { t: 'room', id: 0, code });
}
function join(w, code) {
  const r = code ? rooms.get(code) : [...rooms.values()].find(x => x.st === 'lobby' && x.slots.includes(null));
  if (!r) return send(w, { t: 'err', m: code ? 'Sala não encontrada.' : 'Nenhuma sala aberta agora. Crie uma sala!' });
  const i = r.slots.indexOf(null);
  if (i < 0) return send(w, { t: 'err', m: 'Sala cheia.' });
  w.room = r; w.slot = i; r.slots[i] = w;
  send(w, { t: 'room', id: i, code: r.code });
  r.slots.forEach((c, j) => { if (c && j !== i) { send(w, { t: 'peer', id: j, on: 1 }); send(c, { t: 'peer', id: i, on: 1 }); } });
}

wss.on('connection', w => {
  w.alive = true; w.room = null; w.slot = -1;
  w.on('pong', () => { w.alive = true; });
  w.on('error', () => {});
  w.on('close', () => leave(w));
  w.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    if (m.t === 'create') { leave(w); create(w); }
    else if (m.t === 'join') { leave(w); join(w, String(m.code || '').toUpperCase().slice(0, 4)); }
    else if (m.t === 'in' && w.room && w.slot > 0) {
      send(w.room.slots[0], { t: 'in', id: w.slot, x: num(m.x), y: num(m.y), a: !!m.a, s: !!m.s, s2: !!m.s2, ax: m.ax == null ? null : num(m.ax), ay: num(m.ay) });
    } else if (m.t === 'snap' && w.room && w.slot === 0) {
      if (typeof m.st === 'string') w.room.st = m.st;
      const s = JSON.stringify(m);
      w.room.slots.forEach((c, i) => { if (i > 0 && c && c.readyState === 1) c.send(s); });
    }
  });
});
setInterval(() => wss.clients.forEach(w => { if (!w.alive) return w.terminate(); w.alive = false; w.ping(); }), 25000);
srv.listen(PORT, () => console.log('Legião Alvorada online na porta ' + PORT));
