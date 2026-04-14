const fs = require('fs');
const path = require('path');
const https = require('https');

const CLOUDFRONT_BASE = 'https://du67w5n77drxm.cloudfront.net';
const ASSETS_DIR = path.join(__dirname, '../temp_rot360_assets');

if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                fs.unlink(dest, () => { });
                resolve(null);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded: ${url}`);
                resolve(dest);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function downloadAsset(relativePath) {
    const url = `${CLOUDFRONT_BASE}${relativePath}`;
    const dest = path.join(ASSETS_DIR, relativePath);
    const destDir = path.dirname(dest);

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    if (fs.existsSync(dest)) return;

    try {
        await downloadFile(url, dest);
    } catch (error) {
        // console.error(`Error downloading ${url}:`, error.message);
    }
}

async function run() {
    console.log('Downloading rot360 frames...');

    // Pattern: images/rot360/frame_{0001}.avif
    // Usually these go up to 36, 60, 72, or 100+
    // Let's try up to 200 to be safe.

    // Extensions to try
    const exts = ['.avif', '.webp', '.jpg', '.png'];

    const BATCH_SIZE = 20;
    let promises = [];

    for (let i = 1; i <= 360; i++) {
        // Pad to 4 digits: 0001, 0010, 0100
        const frameNum = String(i).padStart(4, '0');

        for (const ext of exts) {
            const extraPath = `/images/rot360/frame_${frameNum}${ext}`;
            promises.push(downloadAsset(extraPath));
        }

        if (promises.length >= BATCH_SIZE) {
            await Promise.all(promises);
            promises = [];
        }
    }

    if (promises.length > 0) {
        await Promise.all(promises);
    }

    console.log('Rot360 download complete.');
}

run();
