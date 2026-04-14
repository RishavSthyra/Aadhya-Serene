const fs = require('fs');
const path = require('path');
const https = require('https');

const CLOUDFRONT_BASE = 'https://du67w5n77drxm.cloudfront.net';
const ASSETS_DIR = path.join(__dirname, '../temp_all_sections_assets');

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
        // Silent fail on network errors during brute force to avoid clutter
    }
}

async function run() {
    console.log('Brute-forcing assets for ALL sections (Safe Mode)...');

    // Sections derived from project structure
    const sections = ['homepage', 'amenities', 'apartments', 'location', 'about', 'contact', 'walkthrough'];

    let ids = [];
    ids.push('1-1', '16-9', '9-16', '4-5', '5-4');

    for (let i = 1; i <= 6; i++) {
        for (let j = 1; j <= 6; j++) {
            const id = `${i}-${j}`;
            if (!ids.includes(id)) ids.push(id);
        }
    }

    const resolutions = ['2160p', '1440p', '1080p', '720p', '540p', '360p'];
    const codecs = [
        { suffix: '-av1.webm', ext: '.webm' },
        { suffix: '-h265.mp4', ext: '.mp4' },
        { suffix: '-h264.mp4', ext: '.mp4' },
        { suffix: '-vp9.webm', ext: '.webm' },
        { suffix: '.mp4', ext: '.mp4' },
        { suffix: '.webm', ext: '.webm' }
    ];

    // Generate all URLs first
    let allUrls = [];
    for (const section of sections) {
        for (const id of ids) {
            for (const res of resolutions) {
                for (const codec of codecs) {
                    allUrls.push(`/videos/${section}/${id}/${res}/${id}${codec.suffix}`);
                    allUrls.push(`/videos/${section}/${id}/${res}/${id}${codec.ext}`);
                }
            }
        }
    }

    console.log(`Total potential URLs to check: ${allUrls.length}`);

    // Process in small batches to avoid EMFILE
    const BATCH_SIZE = 10;
    for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
        const batch = allUrls.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(url => downloadAsset(url)));
        if (i % 100 === 0) console.log(`Processed ${i} / ${allUrls.length} urls...`);
    }

    console.log('All sections download complete.');
}

run();
