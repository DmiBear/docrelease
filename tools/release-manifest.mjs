import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
const root=process.cwd(), read=p=>fs.readFileSync(path.join(root,p),'utf8')
const project=JSON.parse(read('project.json')), order=JSON.parse(read('guide-order.json'))
const out=path.join(root,'exports');fs.mkdirSync(out,{recursive:true})
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex')
let commit=null;try{commit=execFileSync('git',['rev-parse','--verify','HEAD'],{cwd:root,stdio:['ignore','pipe','ignore']}).toString().trim()}catch{}
const manifest={schema_version:1,project:project.name,app_version:project.app_version,docs_version:project.docs_version,source_commit:commit,git_status:commit?'HEAD recorded; file hashes identify actual working content':'No commit yet',guides:[]}
for(const guide of project.guides){
  const chapters=order[guide.id],sources=[];let text=`# ${project.name}: ${guide.role}\n\nПриложение ${project.app_version}; документация ${project.docs_version}.\n\n`
  for(const chapter of chapters){
    const file='docs/'+chapter,raw=read(file);sources.push({path:file,sha256:sha(raw)})
    let body=raw.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/,'')
    body=body.replace(/^(#{1,5}) /gm,'#$1 ')
    body=body.replace(/(\]\()([^\s)]+)(\))/g,(_,pre,url,post)=>{
      if(/^(?:https?:|mailto:|#)/.test(url))return pre+url+post
      const [p,a]=url.split('#'),resolved=p.startsWith('/')?path.join(root,'docs/public',p):path.resolve(root,'docs',path.dirname(chapter),p)
      return pre+path.relative(out,resolved).split(path.sep).join('/')+(a?'#'+a:'')+post
    })
    text+=body+'\n\n'
  }
  const filename=`${guide.id}-${project.docs_version}.md`,buffer=Buffer.from(text,'utf8')
  fs.writeFileSync(path.join(out,filename),buffer)
  manifest.guides.push({id:guide.id,file:filename,sha256:sha(buffer),bytes:buffer.length,sources})
}
fs.writeFileSync(path.join(out,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n')
fs.writeFileSync(path.join(out,'SHA256SUMS.txt'),manifest.guides.map(g=>`${g.sha256}  ${g.file}`).join('\n')+'\n')
console.log(`Created ${manifest.guides.length} guides and SHA-256 manifest in exports/`)
