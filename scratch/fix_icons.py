import os
import re

def replace_icon_props(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".astro"):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Find <Icon ... /> blocks and replace name= with icon=
                # This handles multi-line tags
                new_content = re.sub(r'(<Icon\s+[^>]*?)\bname=(["{])', r'\1icon=\2', content, flags=re.DOTALL)
                
                if new_content != content:
                    print(f"Updating {path}")
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)

replace_icon_props("src")
