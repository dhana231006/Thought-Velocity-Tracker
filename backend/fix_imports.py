import os

for root, _, files in os.walk('.'):
    if "venv" in root or "__pycache__" in root: continue
    for f in files:
        if f.endswith('.py') and f != 'fix_imports.py':
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            content = content.replace('from .. import', 'import')
            content = content.replace('from ..', 'from ')
            content = content.replace('from . import', 'import')
            content = content.replace('from .', 'from ')
            
            with open(path, 'w', encoding='utf-8') as file:
                file.write(content)
print("Done fixing imports")
