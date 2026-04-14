const https = require('https');
const fs = require('fs');

async function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function scrape() {
    console.log('Fetching main page...');
    const html = await fetchUrl('https://aadhyaserene.com/amenities');

    // Find all Next.js JS chunks
    const jsMatches = [...html.matchAll(/src=\"(\/_next\/static\/chunks\/[^\"]+)/g)].map(m => m[1]);
    console.log(`Found ${jsMatches.length} JS chunks, fetching them...`);

    const videoUrls = new Set();
    const regex = /https:\/\/du67w5n77drxm\.cloudfront\.net\/[^"'\s]+?\.(mp4|webm)/g;

    for (const match of html.matchAll(regex)) videoUrls.add(match[0]);

    for (const chunkPath of jsMatches) {
        const jsUrl = `https://aadhyaserene.com${chunkPath}`;
        try {
            const jsCode = await fetchUrl(jsUrl);
            const matches = [...jsCode.matchAll(regex)];
            for (const match of matches) {
                videoUrls.add(match[0]);
            }
        } catch (e) {
            console.log(`Failed to fetch ${jsUrl}: ${e.message}`);
        }
    }

    console.log('\n--- FOUND VIDEO URLS ---');
    console.log(Array.from(videoUrls).join('\n'));

    fs.writeFileSync('found_videos.txt', Array.from(videoUrls).join('\n'));
    console.log(`\nSaved ${videoUrls.size} unique URLs to found_videos.txt`);
}

scrape();
