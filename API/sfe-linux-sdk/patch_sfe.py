import sys

def patch_file(input_path, output_path, old_key, new_key):
    with open(input_path, "rb") as f:
        data = f.read()
    
    count = data.count(old_key)
    if count == 0:
        print(f"Error: Old key not found in {input_path}")
        return False
    
    patched_data = data.replace(old_key, new_key)
    with open(output_path, "wb") as f:
        f.write(patched_data)
    print(f"Patched {count} occurrence(s) and saved to {output_path}")
    return True

# Old key: 10K (0x912DFCB7) -> \xb7\xfc\x2d\x91
old_key = b"\xb7\xfc\x2d\x91"

# Keys to test
keys = {
    "1": b"\xb0\x30\xb2\x42",    # 0x42B230B0
    "2K": b"\x6d\x1a\x36\xef",   # 0xEF361A6D
    "30K": b"\x45\xd5\xc9\x9e"   # 0x9EC9D545
}

for name, key in keys.items():
    patch_file("sfe.so", f"sfe_{name}.so", old_key, key)
