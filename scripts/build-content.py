"""Build synchronous browser catalogs from editable locale JSON files."""
from pathlib import Path
import json
root = Path(__file__).resolve().parent.parent
for name, global_name in [('mail', 'MailContent'), ('rain', 'RainContent'), ('alex', 'AlexContent')]:
    content = {lang: json.loads((root/f'content/{lang}/{name}.json').read_text()) for lang in ('ru', 'en')}
    if name == 'rain': content['tracks'] = json.loads((root/'content/rain-map.json').read_text())
    if name == 'alex':
        content['files'] = json.loads((root/'content/alex-files.json').read_text())
        content['subtitles'] = {lang: json.loads((root/f'content/{lang}/alex-subtitles.json').read_text()) for lang in ('en', 'ru')}
    (root/f'content/{name}.js').write_text(f'window.{global_name} = '+json.dumps(content, ensure_ascii=False)+';\n')
