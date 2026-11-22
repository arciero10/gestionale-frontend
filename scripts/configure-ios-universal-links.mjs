import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const team = process.argv[2];
if (!/^[A-Z0-9]{10}$/.test(team ?? '')) throw new Error('Pass the real Apple Team ID (10 uppercase letters/digits). No placeholder is generated.');
const config = {applinks:{apps:[],details:[{appID:`${team}.it.panteleia.eventidicomunita`,paths:['/invite/*']} ]}};
writeFileSync(fileURLToPath(new URL('../public/.well-known/apple-app-site-association',import.meta.url)),JSON.stringify(config,null,2)+'\n');
writeFileSync(fileURLToPath(new URL('../public/.well-known/apple-app-site-association.json',import.meta.url)),JSON.stringify(config,null,2)+'\n');
console.log('AASA generated. Verify App ID prefix/entitlements in Xcode, publish and test a signed iOS build.');
