const fs = require('fs');
const path = require('path');

// Scans the `models/` directory for subfolders containing `scene.gltf` or `scene.glb`.
// Reads optional `meta.json` in each model folder and writes a consolidated
// `models/models.json` file which the frontend can fetch at runtime.

const repoRoot = path.join(__dirname, '..');
const modelsDir = path.join(repoRoot, 'models');
const outFile = path.join(modelsDir, 'models.json');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

ensureDir(modelsDir);

const result = {};

if (!fs.existsSync(modelsDir)) {
  console.warn('No models directory found, creating one:', modelsDir);
  ensureDir(modelsDir);
}

const entries = fs.readdirSync(modelsDir, { withFileTypes: true });
for (const e of entries) {
  if (!e.isDirectory()) continue;
  const folder = path.join(modelsDir, e.name);
  const gltf = path.join(folder, 'scene.gltf');
  const glb = path.join(folder, 'scene.glb');
  let scenePath = null;
  if (fs.existsSync(gltf)) scenePath = `models/${e.name}/scene.gltf`;
  else if (fs.existsSync(glb)) scenePath = `models/${e.name}/scene.glb`;
  else {
    // search recursively for any .glb/.gltf inside the folder (e.g., source/Untitled.glb)
    const walk = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const f of files) {
        const p = path.join(dir, f.name);
        if (f.isDirectory()) {
          const found = walk(p);
          if (found) return found;
        } else {
          if (/\.glb$/i.test(f.name) || /\.gltf$/i.test(f.name)) return p;
        }
      }
      return null;
    };
    const found = walk(folder);
    if (found) {
      // convert absolute to project-relative models/ path
      const rel = path.relative(repoRoot, found).replace(/\\/g, '/');
      scenePath = rel;
    }
  }
  if (!scenePath) continue;

  // optional meta.json
  const metaPath = path.join(folder, 'meta.json');
  let meta = {};
  let buildingType = null;
  if (fs.existsSync(metaPath)) {
    try {
      const raw = fs.readFileSync(metaPath, 'utf8');
      const parsed = JSON.parse(raw);
      // Accept two styles:
      // 1) { "buildingType": "bank", "meta": { ... } }
      // 2) { /* direct meta fields */ }
      if (parsed && typeof parsed === 'object') {
        if (parsed.buildingType && parsed.meta) {
          buildingType = parsed.buildingType;
          meta = parsed.meta;
        } else if (parsed.buildingType && !parsed.meta) {
          // buildingType plus other direct meta fields
          buildingType = parsed.buildingType;
          const copy = Object.assign({}, parsed);
          delete copy.buildingType;
          meta = copy;
        } else {
          // treat entire file as meta
          meta = parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to parse meta.json for', e.name, err.message);
    }
  }

  const entry = { path: scenePath };
  if (buildingType) entry.buildingType = buildingType;
  if (Object.keys(meta).length) entry.meta = meta;
  result[e.name] = entry;
}

fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
console.log('Wrote model index to', outFile);
