
import re

with open('constants.ts', 'r') as f:
    content = f.read()

link_db_match = re.search(r'const LINK_DB: Record<string, string> = \{(.*?)\};', content, re.DOTALL)
if link_db_match:
    link_db_content = link_db_match.group(1)
    keys = re.findall(r'^\s+"([^"]+)"', link_db_content, re.MULTILINE)
    seen = set()
    dupes = []
    for k in keys:
        if k in seen:
            dupes.append(k)
        seen.add(k)
    print("Duplicates in LINK_DB:", dupes)
else:
    print("LINK_DB not found")
