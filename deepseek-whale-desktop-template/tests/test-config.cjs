const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {loadConfig}=require('../app-config.cjs');
function fixture(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'whale-config-'));try{fn(dir)}finally{if(path.dirname(path.resolve(dir))!==path.resolve(os.tmpdir())||!path.basename(dir).startsWith('whale-config-'))throw Error('Unexpected test directory');fs.rmSync(dir,{recursive:true,force:true})}}
test('fresh install: local Ollama, optional Harness, separate user data',()=>fixture(root=>{
 const appData=path.join(root,'appdata');const config=loadConfig({root,appData,env:{}});
 assert.equal(config.ollama.baseUrl,'http://127.0.0.1:11434');assert.equal(config.harness.enabled,false);assert.equal(config.harness.cliPath,'');assert.equal(config.dataDir,path.join(appData,'DeepSeekWhaleTemplate'));
}));
test('explicit paths, custom port, disabled auto start, BOM and test data override',()=>fixture(root=>{
 fs.writeFileSync(path.join(root,'custom.json'),'\uFEFF'+JSON.stringify({ollama:{baseUrl:'http://localhost:12000',model:'my-model',autoStart:false},harness:{enabled:true,cliPath:'tools/dsh/lib/bin.js',nodePath:'node',workspace:'project'},dataDir:'local-data'}));
 const c=loadConfig({root,appData:root,env:{WHALE_CONFIG:'custom.json',WHALE_DATA_DIR:path.join(root,'qa-data')}});
 assert.equal(c.ollama.baseUrl,'http://localhost:12000');assert.equal(c.ollama.model,'my-model');assert.equal(c.ollama.autoStart,false);assert.equal(c.harness.cliPath,path.join(root,'tools/dsh/lib/bin.js'));assert.equal(c.dataDir,path.join(root,'qa-data'));
}));
test('reject remote hosts, embedded credentials, URL paths and wrong field types',()=>fixture(root=>{
 const file=path.join(root,'config.local.json');
 for(const url of ['https://127.0.0.1','http://example.com','http://127.0.0.1.evil.test','http://user:secret@localhost','http://localhost/api','http://localhost/?token=x']){
  fs.writeFileSync(file,JSON.stringify({ollama:{baseUrl:url}}));assert.throws(()=>loadConfig({root,appData:root,env:{}}));
 }
 for(const config of [{harness:{enabled:'false'}},{ollama:null},{dataDir:123},[]]){fs.writeFileSync(file,JSON.stringify(config));assert.throws(()=>loadConfig({root,appData:root,env:{}}))}
 fs.writeFileSync(file,'bad JSON');assert.throws(()=>loadConfig({root,appData:root,env:{}}),/有效 JSON/);
}));
