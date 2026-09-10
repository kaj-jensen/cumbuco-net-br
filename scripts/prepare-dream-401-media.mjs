import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
// Pass the owner's Dream Village photo folder as the first argument.
const sourceDir=process.argv[2];
if(!sourceDir) throw new Error('Provide the Dream Village source photo folder.');
const shots=[
[10,'garden-terrace','Garden and covered terrace with outdoor seating','Jardim e varanda coberta com espaço para sentar'],
[3,'living-room-sofa','Living room with corner sofa and terrace access','Sala com sofá de canto e acesso à varanda'],
[1,'double-bedroom','Double bedroom with bedside tables','Quarto com cama de casal e mesas de cabeceira'],
[2,'twin-bedroom','Twin bedroom with air conditioning','Quarto com duas camas de solteiro e ar-condicionado'],
[9,'terrace-hammock','Hammock and wooden seating on the covered terrace','Rede e móveis de madeira na varanda coberta'],
[0,'bedroom-ensuite','Bedroom with wardrobe and adjoining bathroom','Quarto com armário e banheiro privativo'],
[4,'living-room-television','Living room with television beside the kitchen counter','Sala com televisão ao lado do balcão da cozinha'],
[5,'bathroom','Bathroom with basin, mirror and toilet','Banheiro com pia, espelho e vaso sanitário'],
[6,'kitchen-appliances','Kitchen with refrigerator, microwave and cabinets','Cozinha com geladeira, micro-ondas e armários'],
[7,'kitchen-washing-machine','Kitchen counter with sink, hob and washing machine','Bancada da cozinha com pia, fogão e máquina de lavar'],
[8,'terrace-entrance','Terrace entrance beside the garden','Entrada pela varanda junto ao jardim'],
[11,'terrace-deckchairs','Two deckchairs on the shaded terrace','Duas espreguiçadeiras na varanda sombreada'],
[12,'apartment-garden-front','Ground-floor apartment viewed from the garden','Apartamento térreo visto do jardim']];
const output='public/images/properties/dream-village-401-h/2026';
await fs.mkdir(output,{recursive:true});
const gallery=[];let before=0,after=0;
for(const [n,slug,en,pt] of shots){
 const source=path.join(sourceDir,`Dream-Village-Cumbuco${n||''}.jpeg`);
 const base=`${output}/dream-village-401-h-cumbuco-${slug}`;
 before+=(await fs.stat(source)).size;
 const full=await sharp(source).rotate().resize({width:1280,withoutEnlargement:true}).webp({quality:80,effort:6}).toFile(base+'.webp');
 const small=await sharp(source).rotate().resize({width:640,withoutEnlargement:true}).webp({quality:78,effort:6}).toFile(base+'-640.webp');
 after+=full.size;
 gallery.push({src:'/'+base.slice(7)+'.webp',srcset:`/${base.slice(7)}-640.webp ${small.width}w, /${base.slice(7)}.webp ${full.width}w`,width:full.width,height:full.height,en,pt});
 if(n===10)for(const width of [720,480])for(const format of ['jpg','webp','avif']){
 const pipeline=sharp(source).rotate().resize(width,Math.round(width*.75),{fit:'cover'});
 await (format==='jpg'?pipeline.jpeg({quality:84,mozjpeg:true}):format==='webp'?pipeline.webp({quality:80}):pipeline.avif({quality:52})).toFile(base+`-card${width===480?'-480':''}.${format}`);
 }
}
await fs.writeFile('/private/tmp/dream-optimized.json',JSON.stringify(gallery,null,2));
console.log(JSON.stringify({photos:gallery.length,before,after,reduction:1-after/before}));
