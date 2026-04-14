import json
import struct

def read_glb_dummies(filepath):
    with open(filepath, 'rb') as f:
        magic, version, length = struct.unpack('<4sII', f.read(12))
        
        chunk_length, chunk_type = struct.unpack('<I4s', f.read(8))
        json_data = f.read(chunk_length).decode('utf-8')
        gltf = json.loads(json_data)
        
        print("DUMMY TRANSFORMS:")
        for i, node in enumerate(gltf.get('nodes', [])):
            if 'name' in node and 'dummy' in node['name'].lower():
                print(f"Node {node['name']}: {node.get('translation', [0,0,0])}")
                
if __name__ == "__main__":
    read_glb_dummies('C:/Users/user/aadhya_serene_code/AadhyaSerene/public/assets/building.glb')
