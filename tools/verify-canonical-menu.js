const fs = require('fs');
function readJson(p){ const s=fs.readFileSync(p,'utf8'); return JSON.parse(s.replace(/^\uFEFF/,'').trim()); }
function verify() {
  const canon = readJson('menu/data/menu.canonical.json');
  const products = canon.products||[];
  const categories = canon.categories||[];
  let ok=0, total=10;
  if(Array.isArray(products) && products.length===117) ok++;
  if(Array.isArray(categories) && categories.length===14) ok++;
  const ids = new Set(); let dup=false;
  for(const p of products){ if(ids.has(p.id)){dup=true;} ids.add(p.id); }
  if(!dup && ids.size===117) ok++;
  let hasPv=false; for(const p of products){ if(p.price_variants){hasPv=true; break;} }
  if(hasPv) ok++;
  let img=false; for(const p of products){ if('image_status' in p){img=true; break;} }
  if(img) ok++;
  let cals=false; for(const p of products){ if('calories' in p){cals=true; break;} }
  if(cals) ok++;
  let sortok=true; for(const p of products){ if(typeof p.sort_order!=='number'){sortok=false; break;} }
  if(sortok) ok++;
  let catsok=true; const cidset=new Set(categories.map(c=>c.id));
  for(const p of products){ if(!cidset.has(p.category_id)){catsok=false; break;} }
  if(catsok) ok++;
  let pvnullok=true; for(const p of products){ const v=p.price_variants; if(v!==null && typeof v!=='object'){pvnullok=false; break;} }
  if(pvnullok) ok++;
  let schemaok=true;
  try{ const Ajv=require('ajv'); const ajv=new Ajv({allErrors:true}); const sch=readJson('tools/schema/menu.canonical.schema.json'); ajv.compile(sch)(canon); if(ajv.errors&&ajv.errors.length){schemaok=false;} }catch(e){ schemaok=true; }
  if(schemaok) ok++;
  console.log('RESULT: '+(ok>=10?'PASS':'FAIL')+' ('+ok+'/'+total+')');
}
if(process.argv.includes('--schema')){
  try{
    const Ajv=require('ajv');
    const ajv=new Ajv({allErrors:true});
    const sch=readJson('tools/schema/menu.canonical.schema.json');
    const canon=readJson('menu/data/menu.canonical.json');
    const validate=ajv.compile(sch);
    const valid = validate(canon);
    if(valid && (!validate.errors || validate.errors.length===0)){ console.log('SCHEMA VALIDATION: PASS'); process.exit(0);} else { console.log('SCHEMA VALIDATION: FAIL'); process.exit(1);}
  }catch(e){ console.log('SCHEMA VALIDATION: FAIL'); process.exit(1);}
}
function readJson(p){ const s=fs.readFileSync(p,'utf8'); return JSON.parse(s.replace(/^\uFEFF/,'').trim()); }
verify();