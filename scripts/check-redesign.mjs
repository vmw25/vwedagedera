import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
const output=resolve(process.argv[2]||'public');
const htmlPages=[];
function visit(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())visit(p);else if(e.name.endsWith('.html'))htmlPages.push(p);}}
visit(output);
const empty=['research','productivity','school/gcses','school/a-levels','school/ucat','school/interviews','school/work-experience','school/volunteering','school/super-curriculars','school/all'];
for(const path of empty) assert.ok(!existsSync(join(output,path,'index.html')),'Empty listing generated: '+path);
let localRefs=0;
for(const file of htmlPages){
  const html=readFileSync(file,'utf8');
  assert.doesNotMatch(html,/simple-empty-state|articles are being prepared|will appear here when|example\.com|Lorem ipsum/,file);
  const headings=[...html.matchAll(/<h1\b/gi)];
  assert.ok(headings.length<=1,'Duplicate main heading in '+file);
  const ids=[...html.matchAll(/\bid=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/g)].map(m=>m[1]||m[2]||m[3]);
  assert.equal(ids.length,new Set(ids).size,'Duplicate IDs in '+file);
  const refs=[...html.matchAll(/\b(?:href|src|data-mesh-url)=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/g)].map(m=>(m[1]||m[2]||m[3]).replaceAll('&amp;','&'));
  for(let ref of refs){
    if(ref.startsWith('https://vidunwedagedera.com/'))ref=new URL(ref).pathname;
    if(!ref.startsWith('/')||ref.startsWith('//'))continue;
    const path=decodeURIComponent(ref.split(/[?#]/)[0]);
    const target=join(output,path,path.endsWith('/')?'index.html':'');
    assert.ok(existsSync(target),'Missing local target in '+file+': '+ref);localRefs++;
  }
  if(file!==join(output,'index.html')) assert.doesNotMatch(html,/src=[^>]*heart-hero/,'Home scene leaked to '+file);
}
const home=readFileSync(join(output,'index.html'),'utf8');
for(const hook of ['data-heart-scene','data-mesh-url','data-contact-open','data-newsletter-open','data-scroll-focus','home-motion','floating-contact'])assert.ok(home.includes(hook),'Missing '+hook);
assert.doesNotMatch(home,/data-heart-motion|Curiosity, with|nena: personalised learning|A little/);
assert.match(home,/Y5 Medic at Cambridge/);
assert.match(home,/Building at the Intersection of Medicine and Technology/);
assert.doesNotMatch(home,/assistant-launcher|id=["']?newsletter-nudge/);
const hub=readFileSync(join(output,'articles/index.html'),'utf8');
assert.equal((hub.match(/class=["']?simple-project-card(?:[\s"'>])/g)||[]).length,5,'All five published articles remain listed');
assert.doesNotMatch(hub,/href=["']?\/(?:research|productivity)\//);
const article=readFileSync(join(output,'articles/how-to-do-really-well-at-medical-school/index.html'),'utf8');
assert.equal((article.match(/<figcaption/g)||[]).length,2,'Keep both existing figure captions');
assert.match(article,/editorial-article__toc/);
console.log(`Redesign checks passed: ${htmlPages.length} HTML files, ${localRefs} local links/assets, five articles and ten held empty/duplicate listings.`);
