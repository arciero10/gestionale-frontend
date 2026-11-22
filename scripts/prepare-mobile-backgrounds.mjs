// Deterministic responsive derivatives; the original web photographs stay unchanged.
import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const sharp=createRequire(import.meta.url)('sharp');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../public/images/backgrounds');
mkdirSync(join(root,'mobile'),{recursive:true});
for(const name of ['Camino_Neocatecumenal_virgen_maria','censimento-comunita-bg','convivenze-bg','posti-convivenza-bg','camino-neocatecumenal-jubileo-jovenes-roma-agosto-2025-02-1024x478-1']){
  await sharp(join(root,name+'.jpg')).rotate().resize({width:960,withoutEnlargement:true}).webp({quality:78}).toFile(join(root,'mobile',name+'.webp'));
}
