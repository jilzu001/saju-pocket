"""Acquire pinned candidate libraries without installing or running package scripts."""
from pathlib import Path, PurePosixPath
import urllib.request, json, hashlib, base64, tarfile, io
root=Path(__file__).resolve().parent.parent
sources=[]
for name,version in [('korean-lunar-calendar','0.4.0'),('lunar-javascript','1.7.7')]:
    metadata=json.load(urllib.request.urlopen(f'https://registry.npmjs.org/{name}/{version}'))
    archive=urllib.request.urlopen(metadata['dist']['tarball']).read()
    assert 'sha512-'+base64.b64encode(hashlib.sha512(archive).digest()).decode()==metadata['dist']['integrity']
    folder=root/'research'/'vendor'/f'{name}-{version}'
    folder.mkdir(parents=True,exist_ok=True)
    (folder/'package.tgz').write_bytes(archive)
    (folder/'registry-metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
    with tarfile.open(fileobj=io.BytesIO(archive),mode='r:gz') as tar:
        for member in tar.getmembers():
            p=PurePosixPath(member.name)
            if not member.isfile() or p.parts[0]!='package' or '..' in p.parts: continue
            target=folder/'package'/Path(*p.parts[1:])
            assert target.resolve().is_relative_to(folder.resolve())
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(tar.extractfile(member).read())
    sources.append({'name':name,'version':version,'license':metadata.get('license'),'url':metadata['dist']['tarball'],'repository':metadata['repository']['url'],'integrity':metadata['dist']['integrity'],'downloaded':'2026-10-11','status':'candidate-not-production-validated'})
    print(name,version,'integrity verified; source and license preserved')
(root/'research'/'source-lock.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8')
