import {test} from 'node:test';
import assert from 'node:assert/strict';
import {distributionPlan,distribute} from '../scripts/testflight-external.mjs';
const build=(id,version,review='approved',extra={})=>({id,attributes:{version,expired:false,processingState:'VALID',...extra},relationships:{betaAppReviewSubmission:{data:review?{id:review}:null}}});
test('only explicitly approved, unexpired, unlinked future builds can be distributed',()=>{
 const reviews=[{id:'approved',type:'betaAppReviewSubmissions',attributes:{betaReviewState:'APPROVED'}},{id:'waiting',type:'betaAppReviewSubmissions',attributes:{betaReviewState:'WAITING_FOR_REVIEW'}}];
 const result=distributionPlan([build('a','1012'),build('b','1013','waiting'),build('c','1014',null),build('d','1015','approved',{expired:true}),build('old','1009'),build('linked','1016')],reviews,new Set(['linked']),1012);
 assert.deepEqual(result,[{id:'a',version:'1012'}]);
});
test('distribution cannot run without explicit enabling and a reviewed minimum build',async()=>{
 await assert.rejects(distribute({env:{},apply:true}),/DISTRIBUTION_DISABLED/);
 assert.throws(()=>distributionPlan([],[],new Set(),NaN),/INVALID_MINIMUM_BUILD/);
});
