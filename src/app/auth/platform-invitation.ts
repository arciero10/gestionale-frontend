// Redemption secrets are memory-only: never localStorage, sessionStorage or router URLs.
let pending = '';
let expiresAt = 0;
export const PLATFORM_INVITATION_PATH = '/invite/platform';
export function rememberPlatformInvitation(token:string):boolean {
  if(!/^[A-Fa-f0-9]{64}$/.test(token))return false;
  pending=token;expiresAt=Date.now()+3600000;return true;
}
export function readPlatformInvitation():string{return Date.now()<expiresAt?pending:'';}
export function clearPlatformInvitation():void{pending='';expiresAt=0;}
export function platformTokenFromURL(raw:string):string {
  try{const u=new URL(raw);return u.origin==='https://test.eventidicomunita.it'&&u.pathname===PLATFORM_INVITATION_PATH&&!u.search&&!u.username&&!u.password?/^#token=([A-Fa-f0-9]{64})$/.exec(u.hash)?.[1]??'':'';}catch{return '';}
}
export function capturePlatformInvitation():void{
  if(window.location.pathname!==PLATFORM_INVITATION_PATH)return;
  const token=/^#token=([A-Fa-f0-9]{64})$/.exec(window.location.hash)?.[1];
  if(token)rememberPlatformInvitation(token);
  window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);
}
