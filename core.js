/* 纯计算与备份校验独立于界面，便于验证资金流与数据恢复边界。 */
(function(root){
'use strict';
const VERSION=1, KEY='dca-growth-state-v1';
function empty(){return {version:VERSION,completed:[],notes:{},answers:{},visited:[],lastLesson:null,motion:true};}
function validate(raw,ids){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('备份必须是 JSON 对象。');
 if(raw.version!==VERSION)throw Error('不支持这个备份版本，请使用本网站导出的 v1 备份。');
 const allowed=new Set(ids),isId=id=>typeof id==='string'&&allowed.has(id);
 if(!Array.isArray(raw.completed)||raw.completed.some(x=>!isId(x))||new Set(raw.completed).size!==raw.completed.length)throw Error('完成记录包含未知或重复课程。');
 if(!Array.isArray(raw.visited)||raw.visited.some(x=>!isId(x)))throw Error('阅读记录无效。');
 if(raw.lastLesson!==null&&!isId(raw.lastLesson))throw Error('最近阅读课程无效。');
 if(typeof raw.motion!=='boolean')throw Error('动画偏好无效。');
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
 if(!object(raw.notes)||!object(raw.answers))throw Error('笔记或答案格式无效。');
 const result=empty();result.completed=[...raw.completed];result.visited=[...new Set(raw.visited)];result.lastLesson=raw.lastLesson;result.motion=raw.motion;
 for(const [id,note] of Object.entries(raw.notes)){if(!isId(id)||typeof note!=='string'||note.length>50000)throw Error('笔记格式无效或超过单课 50,000 字上限。');result.notes[id]=note;}
 for(const [id,answers] of Object.entries(raw.answers)){if(!isId(id)||!Array.isArray(answers)||answers.length!==2||answers.some(x=>x!==null&&(!Number.isInteger(x)||x<0||x>2)))throw Error('自测答案格式无效。');result.answers[id]=[...answers];}
 return result;
}
function compound(principal,rate,years){if(!Number.isFinite(principal)||principal<0||!Number.isFinite(rate)||rate<=-100||!Number.isInteger(years)||years<0||years>100)throw Error('请输入有效本金、收益率（大于 -100%）和 0–100 年的整数期限。');const values=Array.from({length:years+1},(_,i)=>principal*(1+rate/100)**i);if(!values.every(Number.isFinite))throw Error('参数过大，结果无法计算。');return {values,final:values.at(-1),gain:values.at(-1)-principal};}
function dca(amount,prices){if(!Number.isFinite(amount)||amount<=0||!Array.isArray(prices)||prices.length<2||prices.length>24||prices.some(p=>!Number.isFinite(p)||p<=0))throw Error('每期投入需大于 0，价格需为 2–24 个大于 0 的数字。');let shares=0;const rows=prices.map((price,i)=>{const purchased=amount/price;shares+=purchased;return {period:i+1,price,purchased,shares,cost:(i+1)*amount,value:shares*price};});const total=amount*prices.length,final=shares*prices.at(-1);return {rows,total,shares,average:total/shares,final,profit:final-total};}
function drawdown(prices){if(!Array.isArray(prices)||prices.length<2||prices.length>24||prices.some(p=>!Number.isFinite(p)||p<=0))throw Error('请输入 2–24 个大于 0 的净值。');let peak=prices[0];const series=prices.map(p=>{peak=Math.max(peak,p);return p/peak-1;});return {series,mdd:Math.min(...series)};}
const api={VERSION,KEY,empty,validate,compound,dca,drawdown};root.DCACore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
