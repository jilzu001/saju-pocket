from pathlib import Path
import shutil,hashlib
root=Path(__file__).resolve().parent.parent
out=root/'_site';out.mkdir(exist_ok=True)
for name in ['index.html','style.css','app.js','content.js','manifest.webmanifest']:
 shutil.copy2(root/name,out/name)
for name in ['icons','vendor']:
 shutil.copytree(root/name,out/name,dirs_exist_ok=True)
digest=hashlib.sha256(b''.join(p.read_bytes() for p in sorted(out.rglob('*')) if p.is_file() and p.name!='sw.js')).hexdigest()[:12]
(out/'sw.js').write_text((root/'sw.js').read_text().replace('__VERSION__',digest),encoding='utf8')
(out/'.nojekyll').write_text('')
print('Static PWA built:',digest)
