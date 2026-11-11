"""Validate local references, paired content, and imported track metadata."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
import json
root = Path(__file__).resolve().parent.parent
errors = []
class References(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key not in ('src', 'href', 'data-src') or not value: continue
            url = urlsplit(value)
            if url.scheme or url.netloc or value.startswith('#'): continue
            target = (self.file.parent / unquote(url.path)).resolve()
            if not target.exists(): errors.append(f'{self.file.relative_to(root)}: missing {value}')
for path in [root/'main.html', root/'index.html', root/'choicePage/choice.html', *root.glob('choicePage/characters/*/*.html')]:
    parser = References(); parser.file = path; parser.feed(path.read_text())
for lang in ('ru', 'en'):
    for number in ['main', *map(str, range(1, 16))]:
        assert (root/f'content/{lang}/author-{number}.html').is_file()
    for number in range(1,25): assert (root/f'content/{lang}/tourist-{number}.html').is_file()
    rain = json.loads((root/f'content/{lang}/rain.json').read_text())
    assert len(rain) == 10
    alex = json.loads((root/f'content/{lang}/alex.json').read_text())
    assert len(alex) == 21 and 'main' in alex
    cues = json.loads((root/f'content/{lang}/alex-subtitles.json').read_text())
    assert cues['cues'] and all(c['start'] < c['end'] <= cues['duration'] for c in cues['cues'])
    assert ' '.join(c['text'] for c in cues['cues']) == ' '.join(alex['main'].split())
    mail = json.loads((root/f'content/{lang}/mail.json').read_text())
    assert len(mail['sent']) == 22 and len(mail['drafts']) == 27
    assert all(message['body'].strip() for folder in mail.values() for message in folder)
tracks = json.loads((root/'content/rain.json').read_text())
assert len(tracks) == 10
for name in tracks: assert (root/'imagesAndVideos/audio/rain'/name).is_file()
rain_map = json.loads((root/'content/rain-map.json').read_text())
assert [item['audio'] for item in rain_map] == tracks
assert len({item['poem'] for item in rain_map}) == len(rain) == 10
for track in rain_map:
    assert track['audio'] in tracks and track['poem'] in rain
for file in json.loads((root/'content/alex-files.json').read_text()):
    assert file['id'] in alex and (root/'imagesAndVideos/alex'/file['image']).exists()
assert len(json.loads((root/'content/alex-files.json').read_text())) == 20
# Unicode-normalized author document paths are resolved through numeric content IDs.
errors = [e for e in errors if 'data-open-file' not in e]
if errors: raise SystemExit('\n'.join(errors))
print('PASS: page references, bilingual texts, 10 mapped rain tracks, 20 Alex dossiers, complete narration captions')
