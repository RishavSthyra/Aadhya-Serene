import os
import urllib.request
from concurrent.futures import ThreadPoolExecutor
import subprocess

AMENITIES = [
    'rooftopLeisureDeck',
    'childrensPlayArea',
    'swimmingPool',
    'gymnasium',
    'indoorGames',
    'clubhouse',
    'basketball',
    'badminton'
]

RESOLUTIONS = ['720p', '1080p', '1440p', '2160p']
FORMATS = ['av1.webm', 'vp9.webm', 'h264.mp4', 'hevc.mp4']

BASE_URL = "https://du67w5n77drxm.cloudfront.net/videos/amenities"
OUTPUT_DIR = "downloaded_amenities"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def download_file(url, output_path):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response, open(output_path, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
            return True
    except Exception as e:
        return False

def process_amenity(amenity):
    print(f"Checking {amenity}...")
    success_count = 0
    
    for res in RESOLUTIONS:
        for fmt in FORMATS:
            filename = f"{amenity}-{fmt}"
            url = f"{BASE_URL}/{amenity}/{res}/{filename}"
            
            # Subdirectory struct for s3 layout: videos/amenities/[amenity]/[res]/[filename]
            dir_path = os.path.join(OUTPUT_DIR, amenity, res)
            os.makedirs(dir_path, exist_ok=True)
            output_path = os.path.join(dir_path, filename)
            
            if download_file(url, output_path):
                print(f" [SUCCESS] {amenity} / {res} / {fmt}")
                success_count += 1
            else:
                pass
                # print(f" [FAIL] {amenity} / {res} / {fmt}")
                # Remove empty dir if nothing was downloaded
                
    return amenity, success_count

print("Starting downloads...")
with ThreadPoolExecutor(max_workers=8) as executor:
    results = list(executor.map(process_amenity, AMENITIES))

print("\n--- Download Summary ---")
for amenity, count in results:
    print(f"{amenity}: {count} files downloaded")

print("\nSyncing to S3...")
subprocess.run(["aws", "s3", "sync", OUTPUT_DIR, "s3://aadhya-serene-assets-v2/videos/amenities/"])
print("S3 Sync Complete.")
