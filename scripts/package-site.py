"""Prepare a static dist/ containing only the site's runtime files, without sources or originals."""
from pathlib import Path
import shutil
import subprocess
import sys
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

root = Path(__file__).resolve().parent.parent
subprocess.run([sys.executable, str(root/'scripts/check.py')], check=True)
destination = root/'dist'
if destination.exists(): shutil.rmtree(destination)
destination.mkdir()

def copy(path):
    source = root/path
    target = destination/path
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.is_dir(): shutil.copytree(source, target, ignore=shutil.ignore_patterns('__pycache__', '.DS_Store'))
    else: shutil.copy2(source, target)

for path in ['index.html','main.html','style.css','favicon.ico','JS','css','choicePage']:
    copy(path)
for path in (root/'content').glob('*.js'): copy(path.relative_to(root))
for lang in ('en','ru'):
    for path in (root/'content'/lang).glob('*.html'): copy(path.relative_to(root))
for path in ['intro.mp4','intro-poster.jpg','avtorBackground.jpeg','folderIcon.png','audio/rain','vlublenniyAgent']:
    copy(Path('imagesAndVideos')/path)
for path in (root/'imagesAndVideos/icons').glob('icon-*.png'): copy(path.relative_to(root))
for name in ['film.mp4','alexEN.m4a','alexRU.m4a',*[f'character-{n}.png' for n in range(1,21)]]:
    copy(Path('imagesAndVideos/alex')/name)

class CheckLinks(HTMLParser):
    def handle_starttag(self, _, attrs):
        for key, value in attrs:
            if key not in ('src','href','poster','data-src') or not value: continue
            url = urlsplit(value)
            if url.scheme or url.netloc or value.startswith('#'): continue
            target = (self.path.parent/unquote(url.path)).resolve()
            assert target.exists(), f'Missing packaged resource: {self.path}: {value}'
for path in destination.rglob('*.html'):
    parser = CheckLinks(); parser.path = path; parser.feed(path.read_text())
assert not (destination/'content/source').exists()
assert not list(destination.rglob('*.MOV')) and not list(destination.rglob('*.mov'))
files = [p for p in destination.rglob('*') if p.is_file()]
size = sum(p.stat().st_size for p in files)
print(f'Prepared {destination}: {len(files)} files, {size/1024/1024:.1f} MiB. Nothing published.')
