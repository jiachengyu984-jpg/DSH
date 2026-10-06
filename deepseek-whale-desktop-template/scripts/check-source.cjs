const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const forbiddenDirectories=new Set(['node_modules','tools','data','qa','artifacts','dist','release','.git']);
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isDirectory()){if(!forbiddenDirectories.has(e.name))walk(path.join(dir,e.name))}else if(!['config.local.json','.env'].includes(e.name)&&!e.name.startsWith('.env.'))files.push(path.join(dir,e.name))}}
walk(root);
let failures=0;
for(const file of files){
 if(/\.(?:cjs|js)$/.test(file)){const p=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(p.status!==0){console.error(path.relative(root,file),p.stderr);failures++}}
 if(/\.(?:json|html|css|js|cjs|md|ps1)$/.test(file)){
  const text=fs.readFileSync(file,'utf8');
  const patterns=[/sk-[A-Za-z0-9_-]{20,}/,/gh[pousr]_[A-Za-z0-9]{20,}/,/github_pat_[A-Za-z0-9_]{20,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/[A-Za-z]:[\\/]+Users[\\/]+(?!Public\b)[A-Za-z0-9_.-]+[\\/]/];
  if(patterns.some(re=>re.test(text))){console.error('Potential private value in '+path.relative(root,file)+' (value omitted)');failures++}
 }
}
for(const file of ['index.html','pet.html','style.css','pet.css']){
 const text=fs.readFileSync(path.join(root,file),'utf8');
 const refs=[...text.matchAll(/(?:src|href)="([^"#]+)"|url\(['"]?([^)'"\s]+)['"]?\)/g)].map(m=>m[1]||m[2]);
 for(const ref of refs){if(/^(https?:|data:)/.test(ref))continue;if(!fs.existsSync(path.join(root,ref))){console.error('Missing asset: '+ref);failures++}}
}
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
if(JSON.stringify(pkg.dependencies)!==JSON.stringify(lock.packages[''].dependencies)){console.error('Lockfile mismatch');failures++}
if(failures)process.exitCode=1;else console.log('Source check passed: syntax, asset references, dependency lock and basic private-value scan ('+files.length+' files).');
