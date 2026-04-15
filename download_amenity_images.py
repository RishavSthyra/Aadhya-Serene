"""
Download and downscale amenity images to 1080p.
Tries CDN first, then falls back to extracting frames from S3 videos.
"""
import os
import urllib.request
import subprocess
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed

ASSETS_DIR = os.path.join(os.path.dirname(__file__), 'public', 'assets', 'amenities')
os.makedirs(ASSETS_DIR, exist_ok=True)

FFMPEG = os.path.join(os.path.dirname(__file__), 'ffmpeg-8.1-essentials_build', 'ffmpeg-8.1-essentials_build', 'bin', 'ffmpeg.exe')
if not os.path.exists(FFMPEG):
    FFMPEG = 'ffmpeg'

S3_BUCKET = 'https://aadhya-serene-assets-v2.s3.amazonaws.com'
CDN_BASE = 'https://cdn.sthyra.com/AADHYA%20SERENE/images'

AMENITIES = [
    ('rooftopLeisureDeck', 'rooftop-leisure-deck'),
    ('childrensPlayArea', 'childrens-play-area'),
    ('swimmingPool', 'swimming-pool'),
    ('gymnasium', 'gymnasium'),
    ('indoorGames', 'indoor-games'),
    ('clubhouse', 'clubhouse'),
    ('basketball', 'basketball-court'),
    ('badminton', 'badminton-court'),
]

def try_download_cdn(slug, output_path):
    """Try CDN image URLs with different naming patterns."""
    cdn_variants = [
        f'{CDN_BASE}/{slug}.jpg',
        f'{CDN_BASE}/{slug}.jpeg',
        f'{CDN_BASE}/{slug}.png',
        f'{CDN_BASE}/{slug.replace("-", "_")}.jpg',
    ]
    for url in cdn_variants:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    content_type = resp.headers.get('Content-Type', '')
                    if 'image' in content_type or resp.status == 200:
                        ext = 'jpg' if 'jpeg' not in content_type else 'jpg'
                        out = output_path.replace('.jpg', f'.{ext}')
                        with open(out, 'wb') as f:
                            f.write(resp.read())
                        print(f'  [CDN] Downloaded {slug} from {url}')
                        return out
        except Exception as e:
            continue
    return None


def extract_frame_from_s3(amenity_key, output_path):
    """Extract a single frame from S3 amenity video using ffmpeg."""
    video_url = f'{S3_BUCKET}/videos/amenities/{amenity_key}/2160p/{amenity_key}-h264.mp4'
    tmp_path = output_path + '.tmp.mp4'

    try:
        cmd = [
            FFMPEG, '-y',
            '-ss', '00:00:02',      # grab frame at 2s
            '-i', video_url,
            '-vframes', '1',
            '-q:v', '2',
            tmp_path
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=30)
        if result.returncode == 0 and os.path.exists(tmp_path):
            # Downscale to 1080p
            scale_cmd = [
                FFMPEG, '-y',
                '-i', tmp_path,
                '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
                '-q:v', '2',
                output_path
            ]
            scale_result = subprocess.run(scale_cmd, capture_output=True, timeout=60)
            os.remove(tmp_path)
            if scale_result.returncode == 0:
                print(f'  [S3-FRAME] Extracted frame for {amenity_key}')
                return True
    except Exception as e:
        print(f'  [S3-FRAME] Failed for {amenity_key}: {e}')
    return False


def process_amenity(amenity_key, slug):
    print(f'Processing {amenity_key}...')
    output_path = os.path.join(ASSETS_DIR, f'{amenity_key}.jpg')

    if os.path.exists(output_path) and os.path.getsize(output_path) > 10000:
        print(f'  [SKIP] Already exists: {amenity_key}.jpg')
        return True

    # Try CDN first
    cdn_result = try_download_cdn(slug, output_path)
    if cdn_result and os.path.exists(cdn_result):
        # Downscale to 1080p if needed
        tmp = cdn_result + '.tmp'
        shutil.move(cdn_result, tmp)
        cmd = [
            FFMPEG, '-y',
            '-i', tmp,
            '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
            '-q:v', '2',
            cdn_result
        ]
        subprocess.run(cmd, capture_output=True)
        os.remove(tmp)
        print(f'  [DONE] Downscaled {amenity_key}.jpg to 1080p')
        return True

    # Fallback: extract frame from S3 video
    if extract_frame_from_s3(amenity_key, output_path):
        return True

    print(f'  [WARN] No image found for {amenity_key}')
    return False


def main():
    print(f'Output directory: {ASSETS_DIR}')
    print('Starting amenity image download...\n')

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(process_amenity, key, slug): key
            for key, slug in AMENITIES
        }
        for future in as_completed(futures):
            key = futures[future]
            try:
                future.result()
            except Exception as e:
                print(f'  [ERROR] {key}: {e}')

    print('\nDone!')


if __name__ == '__main__':
    main()
