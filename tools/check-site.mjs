import fs from 'node:fs'
import path from 'node:path'
const dist=path.resolve('docs/.vitepress/dist'),base=process.env.DOCS_BASE||'/',errors=[]
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)])
const pages=walk(dist).filter(p=>p.endsWith('.html')), ids=new Map(),texts=new Map()
for(const file of pages){const s=fs.readFileSync(file,'utf8');texts.set(file,s);ids.set(file,new Set([...s.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])))}
const sourceDocs=path.resolve('docs')
const expected=walk(sourceDocs).filter(p=>p.endsWith('.md')&&!path.relative(sourceDocs,p).split(path.sep).includes('.vitepress')).length+1
if(pages.length!==expected)errors.push(`Unexpected built HTML inventory: ${pages.length}, expected ${expected}`)
for(const file of pages){const rel=path.relative(dist,file).split(path.sep).join('/');if(/^(?:project|contributing)\//.test(rel)||rel==='deployment/site.html')errors.push(`Internal page still published: ${rel}`)}
let checked=0,anchors=0,images=0
for(const [file,html] of texts){
  const route='/'+path.relative(dist,file).split(path.sep).join('/')
  for(const m of html.matchAll(/<(?:a|link|img|script)\b[^>]*?\b(href|src)="([^"]+)"/g)){
    const raw=m[2].replaceAll('&amp;','&');if(/^(?:https?:|mailto:|data:|tel:)/.test(raw))continue
    const url=new URL(raw,'http://local'+(base==='/'?'':base.slice(0,-1))+route)
    let p=decodeURIComponent(url.pathname)
    if(!p.startsWith(base)){errors.push(`${route}: outside base ${raw}`);continue}
    p=p.slice(base.length)
    const candidate=path.resolve(dist,p)
    if(!(candidate===dist||candidate.startsWith(dist+path.sep))){errors.push(`${route}: escapes dist`);continue}
    const targets=[candidate,path.join(candidate,'index.html'),candidate+'.html']
    const target=targets.find(t=>fs.existsSync(t)&&fs.statSync(t).isFile())
    checked++
    if(!target){errors.push(`${route}: missing ${raw}`);continue}
    if(m[1]==='src'&&/\.(?:png|jpg|svg)$/.test(target))images++
    if(url.hash&&target.endsWith('.html')){
      const anchor=decodeURIComponent(url.hash.slice(1));anchors++
      if(!ids.get(target)?.has(anchor))errors.push(`${route}: missing anchor ${raw}`)
    }
  }
}
if(errors.length){console.error([...new Set(errors)].join('\n'));process.exit(1)}
console.log(`PASS: ${pages.length} built HTML pages; ${checked} local links/assets; ${anchors} anchors; ${images} image references`)
