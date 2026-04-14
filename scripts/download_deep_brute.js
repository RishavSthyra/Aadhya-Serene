const fs = require('fs');
const path = require('path');
const https = require('https');

const CLOUDFRONT_BASE = 'https://du67w5n77drxm.cloudfront.net';
const ASSETS_DIR = path.join(__dirname, '../temp_deep_assets_v2');

if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                fs.unlink(dest, () => { });
                // console.warn(`Skipping (status ${response.statusCode}): ${url}`);
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

    // Don't redownload if exists
    if (fs.existsSync(dest)) return;

    try {
        await downloadFile(url, dest);
    } catch (error) {
        console.error(`Error downloading ${url}:`, error.message);
    }
}

async function run() {
    console.log('Brute-forcing video assets...');

    // User pattern: videos/homepage/1-2/2160p/1-2-av1.webm
    // Confirmed pattern: videos/homepage/{ID}/{RES}/{ID}{CODEC}

    // Expand ranges based on "lot of video exists"
    // Assuming ID form "X-Y" where X, Y are integers. 
    // Likely typical aspect ratios or random IDs. 
    // Let's try 1-1 to 5-5, and common ratios.

    const primary = [1, 2, 3, 4, 5, 9, 16];
    const secondary = [1, 2, 3, 4, 5, 9, 10, 16];

    let ids = [];

    // Standard Ratios
    ids.push('1-1', '16-9', '9-16', '4-5', '5-4');

    // Numeric Permutations (1-1, 1-2, ... 3-3)
    for (let i = 1; i <= 5; i++) {
        for (let j = 1; j <= 5; j++) {
            const id = `${i}-${j}`;
            if (!ids.includes(id)) ids.push(id);
        }
    }

    const resolutions = ['2160p', '1440p', '1080p', '720p', '540p'];
    const codecs = [
        { suffix: '-av1.webm', ext: '.webm' },
        { suffix: '-h265.mp4', ext: '.mp4' },
        { suffix: '-h264.mp4', ext: '.mp4' },
        { suffix: '.mp4', ext: '.mp4' },
        { suffix: '.webm', ext: '.webm' }
    ];

    const BATCH_SIZE = 20;
    let promises = [];

    for (const id of ids) {
        for (const res of resolutions) {
            for (const codec of codecs) {
                const p1 = `/videos/homepage/${id}/${res}/${id}${codec.suffix}`;
                const p2 = `/videos/homepage/${id}/${res}/${id}${codec.ext}`;

                promises.push(downloadAsset(p1));
                promises.push(downloadAsset(p2));

                if (promises.length >= BATCH_SIZE) {
                    await Promise.all(promises);
                    promises = [];
                }
            }
        }
    }

    if (promises.length > 0) {
        await Promise.all(promises);
    }

    console.log('Brute-force download complete.');
}

run();
