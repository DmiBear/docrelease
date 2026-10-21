import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
const raw=process.argv.slice(2),action=raw.shift()?.toLowerCase(),opts={}
function fail(message){throw new Error(message)}
if(!['create','backup','restore'].includes(action))fail('Usage: node tools/database.mjs create|backup|restore [--base path] [--platform exe] [--user login] [--dump file.dt]')
while(raw.length){const k=raw.shift(),v=raw.shift();if(!['--base','--platform','--user','--dump'].includes(k)||!v)fail('Unknown or incomplete option: '+k);opts[k]=v}
if(process.platform!=='win32')fail('This helper is for the verified Windows training platform.')
const base=path.resolve(opts['--base']||path.join(repo,'.local/infobase'))
const platform=opts['--platform']||String.raw`C:\Program Files (x86)\1cv8t\8.3.27.1508\bin\1cv8t.exe`
const ps=String.raw`C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`
if(!fs.existsSync(platform))fail('Platform not found. Set --platform to 1cv8t.exe version 8.3.27.1508.')
const literal=s=>"'"+s.replaceAll("'","''")+"'"
// Read-only inventory; no script files, policy changes, termination or UI automation.
const version=execFileSync(ps,['-NoProfile','-NonInteractive','-Command',`(Get-Item -LiteralPath ${literal(platform)}).VersionInfo.FileVersion`],{encoding:'utf8',windowsHide:true}).trim()
if(!/^8\.3\.27\.1508(?:\D|$)/.test(version))fail('Verified platform is 8.3.27.1508; found '+version)
const active=execFileSync(ps,['-NoProfile','-NonInteractive','-Command',"Get-Process -ErrorAction Stop | Select-Object -ExpandProperty ProcessName"],{encoding:'utf8',windowsHide:true}).split(/\r?\n/).filter(n=>['1cv8t','1cv8ct','1cv8st','1cv8s','1cestartt','1cestart'].includes(n.trim().toLowerCase()))
if(active.length)fail('Close all training 1C windows, Designer and launcher before continuing: '+active.join(', '))
for(let p=base;;p=path.dirname(p)){
  if(fs.existsSync(p)){const st=fs.lstatSync(p);if(st.isSymbolicLink()||path.resolve(fs.realpathSync(p)).toLowerCase()!==p.toLowerCase())fail('Symlinks/junctions are not supported in the database path.')}
  if(path.dirname(p)===p)break
}
if(action!=='backup'){
  if(/[\s";\r\n]/.test(base))fail('For native batch creation choose a base path without spaces, quotes or semicolons.')
  if(fs.existsSync(base)&&(!fs.statSync(base).isDirectory()||fs.readdirSync(base).length))fail('Base directory is not empty. Nothing changed; choose a NEW path.')
}else if(!fs.existsSync(path.join(base,'1Cv8.1CD')))fail('The selected database file does not exist.')
let dump=opts['--dump']?path.resolve(opts['--dump']):null
if(action==='restore'&&(!dump||!fs.existsSync(dump)||!fs.statSync(dump).isFile()))fail('Specify an existing --dump file for restore.')
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
if(action==='create'){
  const snapshot=JSON.parse(fs.readFileSync(path.join(repo,'evidence/source-snapshot.json'),'utf8'))
  const inventory=[]
  const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(?:xml|bsl)$/.test(e.name))inventory.push(p)}}
  walk(path.join(repo,'src'));if(inventory.length!==snapshot.files.length)fail('1C source inventory changed.')
  for(const f of snapshot.files)if(!fs.existsSync(path.join(repo,f.path))||sha(path.join(repo,f.path))!==f.sha256)fail('1C source hash differs: '+f.path)
}
const id=new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(4).toString('hex')
const run=path.join(repo,'.local',action==='backup'?'backups':'setup',id)
fs.mkdirSync(run,{recursive:true})
const result={action,time:new Date().toISOString(),base,platform_version:version,status:'RUNNING',stages:[]}
const save=()=>fs.writeFileSync(path.join(run,'result.json'),JSON.stringify(result,null,2)+'\n')
function stage(name,mode,args=[]){
  const log=path.join(run,name+'.log')
  const connection=mode==='CREATEINFOBASE'?['File='+base+';','/Lru','/VLru_RU']:['/F',base,...(opts['--user']?['/N',opts['--user']]:[])]
  const child=spawnSync(platform,[mode,...connection,...args,'/Out',log,'/DisableStartupDialogs','/DisableStartupMessages'],{windowsHide:true,timeout:120000,encoding:'utf8'})
  result.stages.push({name,exit_code:child.status,log:path.basename(log)});save()
  if(child.error||child.status!==0||!fs.existsSync(log))fail(`Stage ${name} failed. See ${run}; ${child.error?.message||'exit '+child.status}`)
  console.log('Completed: '+name)
}
save()
try{
  if(action==='backup'){
    dump=path.join(run,'DocRelease.dt');stage('backup','DESIGNER',['/DumpIB',dump])
    if(!fs.existsSync(dump)||!fs.statSync(dump).size)fail('Backup output is empty.')
    result.dump=dump;result.sha256=sha(dump)
  }else{
    fs.mkdirSync(base,{recursive:true});stage('01-create','CREATEINFOBASE')
    if(action==='restore')stage('02-restore','DESIGNER',['/RestoreIB',dump])
    else{
      stage('02-load','DESIGNER',['/LoadConfigFromFiles',path.join(repo,'src')])
      stage('03-check','DESIGNER',['/CheckConfig','-ConfigLogIntegrity','-IncorrectReferences','-ThinClient','-ThickClientManagedApplication','-Server'])
      stage('04-update','DESIGNER',['/UpdateDBCfg'])
    }
    if(!fs.existsSync(path.join(base,'1Cv8.1CD')))fail('Database file missing after operation.')
  }
  result.status='NATIVE_STAGES_COMPLETED';save()
  console.log(action==='backup'?'Backup: '+dump:'Prepared separate base: '+base)
  console.log('Logs: '+run)
}catch(e){result.status='FAILED';result.error=e.message;save();console.error(e.message);process.exitCode=1}
