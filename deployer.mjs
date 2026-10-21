import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = '/home/user/voxmory';
const EXCLU = new Set(['node_modules', '.git', 'dist', '.vercel', '.arena', 'coverage']);
const FILES = [];
function walk(d) {
  for (const e of readdirSync(d)) {
    if (EXCLU.has(e)) continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else FILES.push(p);
  }
}
walk(ROOT);
const files = FILES.map((p) => ({
  file: relative(ROOT, p),
  data: readFileSync(p).toString('base64'),
  encoding: 'base64',
}));
writeFileSync('/tmp/payload.json', JSON.stringify(files));

const TOKEN = process.env.VERCEL_TOKEN;
const r = await fetch('https://api.vercel.com/v13/deployments', {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'saa-s-voxmory',
    project: 'prj_wfnsmHvpn7h0td1ukiACfe4Yutyo',
    target: 'production',
    files,
    projectSettings: { buildCommand: 'npm run vercel:build', outputDirectory: 'dist', framework: 'vite' },
  }),
});
const j = await r.json();
console.log(r.status, j.id ?? JSON.stringify(j).slice(0, 400), j.readyState ?? '');
