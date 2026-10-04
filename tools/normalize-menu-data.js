const fs=require('fs'); const path=require('path');
const ROOT=process.cwd();
const MD=JSON.parse(fs.readFileSync('menu/menu-data.json'));
const cats=MD.categories; const products=[];
let cid=0; for(const cat in cats){ const items=cats[cat]; items.forEach((it,i)=>{ cid++; products.push({id:'p'+cid,name_ar:it.n||'',name_en:it.en||'',category_id:cat,price:Array.isArray(it.p)?Math.min(...it.p.map(x=>+x)): +it.p,price_variants:null,image:null,image_status:'missing',available:true,visible:true,is_active:true,sort_order:i,slug:(it.en||'').toLowerCase().replace(/[^a-z0-9]+/g,'-')}); }); }
const canon={meta:{schema_version:1,generation:'manual'},categories:Object.keys(cats).map((c,i)=>({id:c,name_ar:c,name_en:c,slug:c,sort_order:i,visible:true,is_active:true})),products};
fs.writeFileSync('menu/data/menu.canonical.json', JSON.stringify(canon,null,2));
console.log('wrote');
