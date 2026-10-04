const fs=require('fs'); const path=require('path');
function read(p){return fs.readFileSync(p,'utf8');}
function write(p,c){fs.writeFileSync(p,c);}
module.exports={read,write};
