import subprocess,json, pathlib
root=pathlib.Path.cwd()
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
refs=[r for r in git('for-each-ref','--format=%(refname:short)','refs/remotes/origin').splitlines() if r!='origin']
head=dict((line.split('\t',1)[1],line.split()[2]) for line in git('ls-tree','-r','HEAD').splitlines())
assets={}; missing=[]; different=[]
for ref in refs:
 for line in git('ls-tree','-r',ref).splitlines():
  meta,path=line.split('\t',1); sha=meta.split()[2]
  if pathlib.Path(path).suffix.lower() in ['.png','.webp','.svg','.jpg','.jpeg','.mp3','.wav','.ogg']:
   assets.setdefault(path,set()).add(sha)
   if path not in head:missing.append((ref,path))
   elif head[path]!=sha:different.append((ref,path,sha,head[path]))
result={'asset_paths':len(assets),'missing':missing,'changed_assets':different,'branches':[{ 'name':r[7:],'ancestor':subprocess.run(['git','merge-base','--is-ancestor',r,'HEAD']).returncode==0} for r in refs]}
print(json.dumps(result,ensure_ascii=False,indent=2))
(root/'docs'/'asset-preservation-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
