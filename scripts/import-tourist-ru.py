"""Import the 24 numbered original texts extracted from the supplied Russian PDF."""
from pathlib import Path
import html
import re

root = Path(__file__).resolve().parent.parent
source = (root / 'content/source/tourist-ru.pdf.txt').read_text()
headings = list(re.finditer(r'(?m)^(\d+)\.[ \t]*([^\n]*)\n', source))
assert [int(match[1]) for match in headings] == list(range(1, 25)), 'Expected texts 1–24 in order'

for index, match in enumerate(headings):
    end = headings[index + 1].start() if index + 1 < len(headings) else len(source)
    # Retain named headings (e.g. Актау), omitting only the anthology numbering.
    text = (match[2].strip() + '\n' + source[match.end():end].strip()).strip()
    assert text
    target = root / f'content/ru/tourist-{match[1]}.html'
    target.write_text('<div lang="ru" style="white-space:pre-wrap">' + html.escape(text) + '</div>')

print('Imported all 24 Russian tourist texts from the original PDF')
