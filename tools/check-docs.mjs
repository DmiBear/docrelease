import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
const root=process.cwd(), docs=path.join(root,'docs'), errors=[]
const read=p=>fs.readFileSync(p,'utf8')
const json=p=>JSON.parse(read(path.join(root,p)))
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.name==='.vitepress'?[]:e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)])
const inside=(base,p)=>p===base||p.startsWith(base+path.sep)
const project=json('project.json'), order=json('guide-order.json'), md=walk(docs).filter(p=>p.endsWith('.md'))
for (const file of md) {
  const rel=path.relative(docs,file).split(path.sep).join('/')
  if (/^(?:project|contributing)\//.test(rel)||rel==='deployment/site.md') errors.push(`Internal material in reader site: ${rel}`)
}
let links=0, images=0
for(const file of md){
  const text=read(file), rel=path.relative(root,file)
  const fm=text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if(!fm){errors.push(`${rel}: missing frontmatter`);continue}
  for(const key of ['title','description','doc_id','app_version','docs_version','reviewed'])
    if(!new RegExp(`^${key}: .+`,'m').test(fm[1]))errors.push(`${rel}: missing ${key}`)
  for(const key of ['app_version','docs_version'])
    if(!fm[1].includes(`${key}: ${project[key]}`))errors.push(`${rel}: incorrect ${key}`)
  const body=text.slice(fm[0].length), h1=[...body.matchAll(/^# /gm)]
  if(h1.length!==(/layout: home/.test(fm[1])?0:1))errors.push(`${rel}: expected one H1`)
  if(/(?:^|[\s(])(?:[A-Z]:[\\/]|file:\/\/\/)/im.test(body))errors.push(`${rel}: absolute local path in published prose`)
  if (/\t/.test(body))errors.push(`${rel}: tab character in prose or command`);
  const withoutCode=body.replace(/```[\s\S]*?```/g,'')
  for (const im of withoutCode.matchAll(/!\[([^\]\n]*)\]\(([^)]+)\)/g)) { images++; if (!im[1].trim()) errors.push(`${rel}: image without alt`); }
  for(const m of withoutCode.matchAll(/(!?)\[([^\]\n]*)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)){
    const [,img,label,url]=m; links++
    if(/^(?:https?:|mailto:)/.test(url))continue
    let [pathname,anchor]=url.split('#');if(!pathname)continue
    pathname=decodeURIComponent(pathname)
    const target=pathname.startsWith('/')?path.join(docs,'public',pathname):path.resolve(path.dirname(file),pathname)
    if(!inside(root,target)){errors.push(`${rel}: path escapes repository: ${url}`);continue}
    if(!fs.existsSync(target))errors.push(`${rel}: missing target ${url}`)
    // Exact anchor existence is checked against generated HTML by the browser/build check.
  }
}
for(const guide of project.guides){
  if(!fs.existsSync(path.join(root,guide.entry)))errors.push(`Guide missing: ${guide.id}`)
  if(!order[guide.id]?.length)errors.push(`Guide order missing: ${guide.id}`)
  for(const f of order[guide.id]||[])if(!fs.existsSync(path.join(docs,f)))errors.push(`Missing guide chapter: ${f}`)
}
const media=json('evidence/media-manifest.json').images
for(const item of media){const p=path.join(root,item.file);if(!fs.existsSync(p)||sha(p)!==item.sha256)errors.push(`Image changed: ${item.file}`)}
const snap=json('evidence/source-snapshot.json')
for(const item of snap.files){const p=path.join(root,item.path);if(!fs.existsSync(p)||sha(p)!==item.sha256)errors.push(`1C source changed: ${item.path}`)}
const sourceFiles=walk(path.join(root,'src')).filter(p=>/\.(xml|bsl)$/.test(p))
if(sourceFiles.length!==snap.files.length)errors.push('1C source inventory changed')
const publicFiles=walk(docs).filter(p=>inside(path.join(docs,'public'),p))
if(publicFiles.some(p=>/\.(?:1cd|dt|cf|log|epf)$/i.test(p)))errors.push('Local database or log in public assets')
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`PASS: ${md.length} pages; ${project.guides.length} guides; ${links} links; ${images} image references; ${media.length} original screenshots; ${snap.files.length} unchanged XML/BSL files`)
