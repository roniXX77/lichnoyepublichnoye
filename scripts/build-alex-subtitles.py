"""Create editable estimated cues from the supplied text and each narration's voiced intervals.
Timing is a reading estimate, not word-level forced alignment.
"""
from pathlib import Path
import json
import re
import subprocess
root = Path(__file__).resolve().parent.parent
for lang in ('en','ru'):
    text = json.loads((root/f'content/{lang}/alex.json').read_text())['main']
    words = re.sub(r'\s+', ' ', text).split()
    chunks, current = [], ''
    for word in words:
        if current and len(current) + len(word) > 100:
            chunks.append(current); current = ''
        current = (current + ' ' + word).strip()
        if len(current) >= 45 and re.search(r'[.!?]$', word):
            chunks.append(current); current = ''
    if current: chunks.append(current)
    audio = root/f'imagesAndVideos/alex/alex{lang.upper()}.m4a'
    duration = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(audio)], text=True))
    info = subprocess.run(['ffmpeg','-i',str(audio),'-af','silencedetect=noise=-35dB:d=0.28','-f','null','-'],capture_output=True,text=True,check=True).stderr
    events = [(kind,float(t)) for kind,t in re.findall(r'silence_(start|end): ([\d.]+)',info)]
    intervals, position = [], 0.0
    for kind,t in events:
        if kind=='start':
            if t>position: intervals.append((position,t))
        else: position=t
    if position<duration and (not events or events[-1][0]=='end'): intervals.append((position,duration))
    active=sum(b-a for a,b in intervals)
    def clock(t):
        for a,b in intervals:
            if t<=b-a:return a+t
            t-=b-a
        return intervals[-1][1]
    weights=[max(1,len(re.findall(r'[aeiouyаеёиоуыэюя]',s,re.I))) for s in chunks]
    total=sum(weights);elapsed=0;cues=[]
    for i,(chunk,weight) in enumerate(zip(chunks,weights)):
        start=clock(active*elapsed/total);elapsed+=weight
        end=clock(active*elapsed/total)
        cues.append({'start':round(start,3),'end':round(end,3),'text':chunk})
    result={'timing':'estimated-from-voiced-duration','duration':duration,'cues':cues}
    (root/f'content/{lang}/alex-subtitles.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    def timestamp(t):
        ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
    vtt='WEBVTT\n\n'+'\n\n'.join(f'{i+1}\n{timestamp(c["start"])} --> {timestamp(c["end"])}\n{c["text"]}' for i,c in enumerate(cues))+'\n'
    (root/f'content/{lang}/alex.vtt').write_text(vtt)
    print(lang,len(cues),'cues',round(duration,1),'seconds')
