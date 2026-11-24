import os
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend', 'src')
for root, dirs, files in os.walk(base):
    for f in files:
        if f.endswith('.jsx') or f.endswith('.js'):
            path = os.path.join(root, f)
            with open(path) as fh:
                content = fh.read()
            testids = [line for line in content.split('\n') if 'data-testid' in line.lower()]
            if testids:
                print(f'{os.path.relpath(path, base)}:')
                for t in testids:
                    print(f'  {t.strip()}')