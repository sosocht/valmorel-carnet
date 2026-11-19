// Chiffre les billets, factures et références avec un mot de passe (AES-GCM 256, clé dérivée par PBKDF2-SHA256).
// Usage : CARNET_MDP="mot de passe" node tools/build.mjs
// Entrées : secret/secret.src.json + les fichiers listés dedans (dossier secret/, jamais publié).
// Sorties : data/secret.enc, files/<id>.enc, data/meta.json (sel et paramètres, sans le mot de passe).
import { webcrypto as crypto } from 'node:crypto';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const mdp = process.env.CARNET_MDP;
if (!mdp) { console.error('CARNET_MDP manquant'); process.exit(1); }

const ITER = 250000;
const enc = new TextEncoder();
const src = JSON.parse(await readFile(join(racine, 'secret', 'secret.src.json'), 'utf8'));

const sel = crypto.getRandomValues(new Uint8Array(16));
const base = await crypto.subtle.importKey('raw', enc.encode(mdp), 'PBKDF2', false, ['deriveKey']);
const cle = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt: sel, iterations: ITER, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);

async function chiffre(octets) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cle, octets));
  const sortie = new Uint8Array(12 + ct.length);
  sortie.set(iv, 0); sortie.set(ct, 12);
  return sortie;
}

await rm(join(racine, 'files'), { recursive: true, force: true });
await mkdir(join(racine, 'files'), { recursive: true });
await mkdir(join(racine, 'data'), { recursive: true });

const docs = [];
for (const d of src.docs) {
  const octets = new Uint8Array(await readFile(join(racine, 'secret', d.file)));
  await writeFile(join(racine, 'files', d.id + '.enc'), await chiffre(octets));
  docs.push({ id: d.id, step: d.step, label: d.label, name: d.name || d.file, mime: d.mime, kind: d.kind, who: d.who || null, taille: octets.length });
}
const secret = { ...src, docs };
delete secret.docs_src;
await writeFile(join(racine, 'data', 'secret.enc'), await chiffre(enc.encode(JSON.stringify(secret))));
await writeFile(join(racine, 'data', 'meta.json'), JSON.stringify({ v: 1, iter: ITER, sel: Buffer.from(sel).toString('base64') }));
console.log('fichiers chiffrés :', docs.length);
