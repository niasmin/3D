import {build} from 'esbuild';
import {readFileSync,writeFileSync} from 'node:fs';
await build({entryPoints:['three/src/game3d.js'],bundle:true,format:'esm',minify:true,outfile:'web/three/game3d.js'});
const path='web/three/game3d.js';
// Shader template strings do not require trailing spaces. Keep generated source clean.
writeFileSync(path,readFileSync(path,'utf8').replace(/[\t ]+$/gm,''));
