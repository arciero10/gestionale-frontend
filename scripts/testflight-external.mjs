import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

export function distributionPlan(builds,included,linked,minimum){
  if(!Number.isSafeInteger(minimum)||minimum<1)throw new Error('INVALID_MINIMUM_BUILD');
  const approved=new Set(included.filter(x=>x.type==='betaAppReviewSubmissions'&&x.attributes?.betaReviewState==='APPROVED').map(x=>x.id));
  return builds.filter(x=>/^\d+$/.test(x.attributes?.version??'')&&Number(x.attributes.version)>=minimum&&
    x.attributes.processingState==='VALID'&&x.attributes.expired===false&&
    approved.has(x.relationships?.betaAppReviewSubmission?.data?.id)&&!linked.has(x.id)).map(x=>({id:x.id,version:x.attributes.version}));
}
export async function distribute({env=process.env,fetchImpl=fetch,apply=false}={}){
  if(apply&&env.IOS_EXTERNAL_DISTRIBUTION_ENABLED!=='true')throw new Error('DISTRIBUTION_DISABLED');
  const minimum=Number(env.IOS_EXTERNAL_MIN_BUILD);
  if(!Number.isSafeInteger(minimum)||minimum<1)throw new Error('MINIMUM_BUILD_REQUIRED');
  const now=Math.floor(Date.now()/1000);
  const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
  if(!/^[A-Z0-9]{10}$/.test(env.APP_STORE_CONNECT_KEY_ID??'')||!/^[-a-f0-9]{36}$/i.test(env.APP_STORE_CONNECT_ISSUER_ID??''))throw new Error('APPLE_CONFIGURATION_REQUIRED');
  const data=encode({alg:'ES256',kid:env.APP_STORE_CONNECT_KEY_ID,typ:'JWT'})+'.'+encode({iss:env.APP_STORE_CONNECT_ISSUER_ID,iat:now-20,exp:now+300,aud:'appstoreconnect-v1'});
  const token=data+'.'+crypto.sign('sha256',Buffer.from(data),{key:crypto.createPrivateKey(env.APP_STORE_CONNECT_PRIVATE_KEY??''),dsaEncoding:'ieee-p1363'}).toString('base64url');
  async function request(path,body){
    const response=await fetchImpl('https://api.appstoreconnect.apple.com/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error('APPLE_HTTP_'+response.status);
    return response.status===204?{}:response.json();
  }
  const apps=await request('apps?filter[bundleId]=it.panteleia.eventidicomunita');
  if(apps.data?.length!==1)throw new Error('APP_NOT_UNIQUE');
  const appId=apps.data[0].id;
  const groups=await request('betaGroups?filter[app]='+encodeURIComponent(appId)+'&limit=200');
  const selected=groups.data.filter(x=>x.attributes?.name==='PANTELEIA - Beta Comunità'&&x.attributes.isInternalGroup===false);
  if(selected.length!==1)throw new Error('EXTERNAL_GROUP_NOT_UNIQUE');
  const groupId=selected[0].id;
  const linked=await request('betaGroups/'+encodeURIComponent(groupId)+'/relationships/builds?limit=200');
  if(linked.links?.next)throw new Error('GROUP_PAGINATION_REVIEW_REQUIRED');
  const builds=await request('builds?filter[app]='+encodeURIComponent(appId)+'&filter[processingState]=VALID&include=betaAppReviewSubmission&limit=200&sort=-uploadedDate');
  const plan=distributionPlan(builds.data,builds.included??[],new Set((linked.data??[]).map(x=>x.id)),minimum);
  if(apply&&plan.length)await request('betaGroups/'+encodeURIComponent(groupId)+'/relationships/builds',{data:plan.map(x=>({type:'builds',id:x.id}))});
  console.log(JSON.stringify({mode:apply?'apply':'dry-run',approvedBuilds:plan.map(x=>x.version),associated:apply?plan.length:0}));
  return plan;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  distribute({apply:process.argv.includes('--apply')}).catch(()=>{console.error('External distribution stopped. Check approval, group, minimum build and Apple API configuration; no review bypass attempted.');process.exitCode=1;});
}
