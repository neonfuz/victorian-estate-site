/**
 * Generates the responsive img/ folder from the originals in assets/.
 *
 * For every .jpg/.jpeg/.png under assets/ (recursively), writes:
 *   img/<slugged-path>/<slugged-name>-<width>w.jpg   (mozjpeg, progressive, q80)
 *   img/<slugged-path>/<slugged-name>-<width>w.webp  (q75)
 * at each width in WIDTHS that fits without enlarging, plus the source's
 * native width when it is smaller than the largest step. Also writes
 * img/manifest.json mapping each source file to its variants and dimensions.
 *
 * Builds are fingerprint-guarded: a sha256 over this script's source, the
 * installed sharp version, and every file under assets/ is stored in
 * img/.build-hash, and repeat builds with no changes exit without
 * rebuilding. Run with: npm run build        (add -- --force to rebuild anyway)
 */

import crypto from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SRC_DIR = 'assets';
const OUT_DIR = 'img';
const HASH_FILE = path.join(OUT_DIR, '.build-hash');
const WIDTHS = [480, 960, 1440 /* px */, 2000];
const FORCE = process.argv.includes('--force');

function slugifySegment(seg) {
    return seg
        .toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function slugifyRelPath(rel) {
    const parts = rel.split(path.sep).map(slugifySegment);
    return parts.join('/');
}

async function walkFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...await walkFiles(full));
        } else {
            files.push(full);
        }
    }
    return files.sort();
}

async function findImages(dir) {
    return (await walkFiles(dir)).filter(f => /\.(jpe?g|png)$/i.test(f));
}

/**
 * Fingerprint of everything that determines img/'s contents: this script's
 * own source, the installed sharp version, and every file under assets/
 * (relative path + bytes). Content-only — mtimes are ignored so fresh git
 * clones on Netlify don't spuriously invalidate the restored cache.
 */
async function computeAssetsHash() {
    const hash = crypto.createHash('sha256');
    hash.update(await fs.readFile(fileURLToPath(import.meta.url)));
    hash.update(JSON.parse(await fs.readFile('node_modules/sharp/package.json', 'utf8')).version);
    for (const file of await walkFiles(SRC_DIR)) {
        hash.update(path.relative(SRC_DIR, file).split(path.sep).join('/') + '\0');
        await new Promise((resolve, reject) => {
            createReadStream(file)
                .on('data', chunk => hash.update(chunk))
                .on('end', resolve)
                .on('error', reject);
        });
        hash.update('\0');
    }
    return hash.digest('hex');
}

async function hasValidCache(fingerprint) {
    try {
        return (await fs.readFile(HASH_FILE, 'utf8')).trim() === fingerprint
            && (await fs.stat(path.join(OUT_DIR, 'manifest.json'))).isFile();
    } catch {
        return false;
    }
}

function variantWidths(srcWidth) {
    const widths = WIDTHS.filter(w => w < srcWidth);
    if (srcWidth <= Math.max(...WIDTHS)) widths.push(srcWidth);
    return widths.length ? widths : [srcWidth];
}

async function processImage(file) {
    const rel = path.relative(SRC_DIR, file);
    const input = sharp(file, { failOn: 'none' }).rotate(); // honor EXIF orientation
    const meta = await input.metadata();

    // metadata() reports pre-rotation dimensions; swap when rotated 90/270°
    const rotated = meta.orientation !== undefined && meta.orientation >= 5;
    const srcWidth = rotated ? meta.height : meta.width;
    const srcHeight = rotated ? meta.width : meta.height;

    const widths = variantWidths(srcWidth);
    const slugBase = path.join(
        OUT_DIR,
        slugifyRelPath(path.join(path.dirname(rel), path.basename(rel, path.extname(rel))))
    );

    await fs.mkdir(path.dirname(slugBase), { recursive: true });

    const jobs = [];
    for (const width of widths) {
        const resized = input.clone().flatten({ background: '#ffffff' }).resize({ width });
        jobs.push(resized.clone().jpeg({ quality: 80, progressive: true, mozjpeg: true })
            .toFile(`${slugBase}-${width}w.jpg`));
        jobs.push(resized.clone().webp({ quality: 75 })
            .toFile(`${slugBase}-${width}w.webp`));
    }
    await Promise.all(jobs);

    const stat = await fs.stat(file);
    return {
        rel: rel.split(path.sep).join('/'),
        width: srcWidth,
        height: srcHeight,
        widths,
        base: slugBase.split(path.sep).join('/'),
        inputBytes: stat.size,
    };
}

async function main() {
    const started = Date.now();
    const fingerprint = await computeAssetsHash();

    if (!FORCE && await hasValidCache(fingerprint)) {
        console.log('assets unchanged — keeping existing img/ (use --force to rebuild)');
        return;
    }

    await fs.rm(OUT_DIR, { recursive: true, force: true });

    const files = await findImages(SRC_DIR);
    const manifest = {};
    let inputBytes = 0;

    for (const file of files) {
        const info = await processImage(file);
        inputBytes += info.inputBytes;
        manifest[info.rel] = {
            base: info.base,
            widths: info.widths,
            width: info.width,
            height: info.height,
        };
        console.log(`${info.rel} -> ${info.base}-[${info.widths.join(',')}]w`);
    }

    await fs.writeFile(
        path.join(OUT_DIR, 'manifest.json'),
        JSON.stringify(manifest, null, 2) + '\n'
    );

    const outputBytes = (await fs.readdir(OUT_DIR, { recursive: true }))
        .filter(f => !f.isDirectory?.() && String(f).match(/\.(jpg|webp)$/))
        .map(String);
    let outBytes = 0;
    for (const f of outputBytes) {
        outBytes += (await fs.stat(path.join(OUT_DIR, f))).size;
    }

    await fs.writeFile(HASH_FILE, fingerprint + '\n');

    const fmt = n => (n / 1024 / 1024).toFixed(1) + ' MB';
    console.log(`\n${files.length} images -> ${outputBytes.length} variants in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    console.log(`${fmt(inputBytes)} in -> ${fmt(outBytes)} out`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
