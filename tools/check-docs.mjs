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
// A screenshot has a stable asset name and a separate number for every guide usage.
const expectedUses=new Map(media.map(item=>[item.file,[]]))
let figures=0
for(const guide of project.guides){
  let next=1
  for(const chapter of order[guide.id]||[]){
    const file=path.join(docs,chapter)
    if(!fs.existsSync(file))continue
    const text=read(file), pageNumbers=new Set()
    const pattern=/!\[(Рисунок (\d+) — [^\]\n]+)\]\((\/images\/[^)]+)\)/g
    for(const match of text.matchAll(pattern)){
      const [,caption,value,url]=match,number=Number(value),asset='docs/public'+url
      figures++;pageNumbers.add(number)
      if(number!==next)errors.push(`${chapter}: figure ${number}, expected ${next} in ${guide.id}`)
      next++
      // The visible caption must immediately follow the linked original image.
      const after=text.slice(match.index+match[0].length)
      const visible=after.match(/^\]\([^\n]+\)\s*\n\s*\n\*([^\n]+)\*/)
      if(visible?.[1]!==caption)errors.push(`${chapter}: image alt and visible caption differ for figure ${number}`)
      const uses=expectedUses.get(asset)
      if(!uses)errors.push(`${chapter}: screenshot not in media manifest: ${url}`)
      else uses.push({guide:guide.id,page:chapter,figure:number,caption})
    }
    const prose=text.replace(/\[!\[[^\n]+\n\n\*Рисунок [^\n]+\*/g,'')
    const references=[...prose.matchAll(/(?:рисунок|рисунке) (\d+)/g)].map(m=>Number(m[1]))
    for(const number of references)if(!pageNumbers.has(number))errors.push(`${chapter}: reference to missing figure ${number}`)
    for(const number of pageNumbers)if(!references.includes(number))errors.push(`${chapter}: figure ${number} has no reference in prose`)
  }
}
for(const item of media){
  const expected=expectedUses.get(item.file)
  if(!expected.length)errors.push(`Unused screenshot in manifest: ${item.file}`)
  if(JSON.stringify(item.uses)!==JSON.stringify(expected))errors.push(`Figure usage differs from manifest: ${item.file}`)
}
// The downloadable kit and the browsable source folder must contain the same bytes.
const kit=json('docs/public/downloads/package-manifest.json')
const kitRoot=path.resolve(root,kit.source_directory)
if(!inside(path.join(root,'application'),kitRoot))errors.push('Package source directory escapes application/')
else {
  const sourceFiles=walk(kitRoot).map(p=>path.relative(kitRoot,p).split(path.sep).join('/')).sort()
  const declared=kit.files.map(f=>f.path.replace(/^configuration\//,'')).sort()
  if(JSON.stringify(sourceFiles)!==JSON.stringify(declared)||declared.length!==kit.configuration_file_count)errors.push('Package source inventory differs from manifest')
  for(const item of kit.files){
    const p=path.resolve(kitRoot,item.path.replace(/^configuration\//,''))
    if(!inside(kitRoot,p)||!fs.existsSync(p)||sha(p)!==item.sha256||fs.statSync(p).size!==item.bytes)errors.push(`Package file changed: ${item.path}`)
  }
  const configuration=read(path.join(kitRoot,'Configuration.xml'))
  if(!configuration.includes(`<Version>${project.app_version}</Version>`))errors.push('Configuration version differs from documentation')
}
const archive=path.resolve(root,'docs/public/downloads',kit.filename)
if(!inside(path.join(root,'docs/public/downloads'),archive)||!fs.existsSync(archive)||sha(archive)!==kit.sha256||fs.statSync(archive).size!==kit.bytes)errors.push('Download archive differs from manifest')
if(kit.app_version!==project.app_version)errors.push('Download version differs from documentation')
if(read(path.join(root,'docs/public/downloads/SHA256SUMS.txt')).trim()!==`${kit.sha256}  ${kit.filename}`)errors.push('Download checksum file differs')
const publicFiles=walk(docs).filter(p=>inside(path.join(docs,'public'),p))
if(publicFiles.some(p=>/\.(?:1cd|dt|cf|log|epf)$/i.test(p)))errors.push('Local database or log in public assets')
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`PASS: ${md.length} pages; ${project.guides.length} guides; ${links} links; ${figures} numbered figures; ${media.length} original screenshots; ${kit.configuration_file_count} package files`)
