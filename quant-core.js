/* 教学用纯计算：不接入行情或交易，所有百分数单位由各接口明确约定。 */
(function(root){
'use strict';

function nonnegative(value,label){
 if(!Number.isFinite(value)||value<0)throw Error(label+'必须是有限的非负数。');
}
function numericArray(values,label,positive){
 if(!Array.isArray(values)||values.length===0)throw Error(label+'必须是非空数组。');
 for(let i=0;i<values.length;i++){
  if(!Number.isFinite(values[i])||(positive?values[i]<=0:values[i]<0))throw Error(label+'第 '+(i+1)+' 项必须是有限的'+(positive?'正数':'非负数')+'。');
 }
}
function totalOf(values){
 const total=values.reduce((sum,value)=>sum+value,0);
 if(!Number.isFinite(total))throw Error('数值过大，合计无法计算。');
 return total;
}
function portfolio(values,targets){
 numericArray(values,'当前市值',false);numericArray(targets,'目标权重',false);
 if(values.length!==targets.length)throw Error('当前市值与目标权重的数量必须一致。');
 if(targets.some(value=>value>1)||Math.abs(totalOf(targets)-1)>1e-10)throw Error('目标权重必须位于 0–1 之间且合计为 1。');
 return totalOf(values);
}
function weightsOf(values,total){return values.map(value=>total===0?0:value/total);}

// fee、drawdown、trackingError 使用百分数，例如 0.4 表示 0.4%。
function screenFunds(funds,options){
 if(!Array.isArray(funds))throw Error('基金数据必须是数组。');
 if(!options||typeof options!=='object')throw Error('请提供基金筛选条件。');
 const {maxFee,maxDrawdown,minHistory}=options;
 nonnegative(maxFee,'最高费用');nonnegative(maxDrawdown,'最大回撤上限');nonnegative(minHistory,'最短历史年数');
 for(let i=0;i<funds.length;i++){
  const fund=funds[i];
  if(!fund||typeof fund!=='object'||Array.isArray(fund))throw Error('第 '+(i+1)+' 只基金的数据无效。');
  for(const key of ['fee','drawdown','history','trackingError'])nonnegative(fund[key],'第 '+(i+1)+' 只基金的 '+key);
 }
 return funds.filter(fund=>fund.fee<=maxFee&&fund.drawdown<=maxDrawdown&&fund.history>=minHistory)
  .sort((a,b)=>a.fee-b.fee||a.trackingError-b.trackingError);
}

// 传入截至决策月的数据；skip 排除末尾月份，结果为小数收益率。
function momentum(prices,lookback=6,skip=1){
 numericArray(prices,'月度价格',true);
 if(!Number.isSafeInteger(lookback)||lookback<1)throw Error('回看月数必须是正整数。');
 if(!Number.isSafeInteger(skip)||skip<0)throw Error('跳过月数必须是非负整数。');
 const end=prices.length-1-skip,start=end-lookback;
 if(start<0)throw Error('价格数量不足，需要至少 '+(lookback+skip+1)+' 个月的数据。');
 const result=prices[end]/prices[start]-1;
 if(!Number.isFinite(result))throw Error('价格比例过大，动量无法计算。');
 return result;
}

// 逆波动加权没有使用相关性矩阵，不是完整的风险平价算法。
function inverseVolatility(vols){
 numericArray(vols,'波动率',true);
 const smallest=vols.reduce((a,b)=>Math.min(a,b));
 // 先缩放再归一化，避免极小正波动率的倒数溢出。
 const scores=vols.map(value=>smallest/value),total=totalOf(scores);
 return scores.map(value=>value/total);
}

function allocateContribution(values,targets,amount){
 const beforeTotal=portfolio(values,targets);nonnegative(amount,'新增投入');
 const total=totalOf([beforeTotal,amount]);
 const targetTotal=totalOf(targets);
 const gaps=values.map((value,i)=>Math.max(0,total*(targets[i]/targetTotal)-value));
 const gapTotal=totalOf(gaps);
 const buys=gaps.map(gap=>amount===0||gapTotal===0?0:amount*(gap/gapTotal));
 const after=values.map((value,i)=>value+buys[i]);
 return {buys,after,weights:weightsOf(after,totalOf(after))};
}

function rebalance(values,targets,threshold){
 const total=portfolio(values,targets);nonnegative(threshold,'再平衡阈值');
 if(threshold>1)throw Error('再平衡阈值使用 0–1 之间的小数。');
 const weights=weightsOf(values,total);
 const deviation=weights.reduce((max,weight,i)=>Math.max(max,Math.abs(weight-targets[i])),0);
 // 零资金没有可交易仓位；浮点容差只用于恰好落在阈值的比较。
 const triggered=total>0&&deviation>0&&(deviation>=threshold||Math.abs(deviation-threshold)<=Number.EPSILON*4);
 const targetTotal=totalOf(targets);
 // 归一化仅吸收合法权重合计的浮点舍入误差，保持资金守恒。
 const after=triggered?targets.map(target=>total*(target/targetTotal)):values.slice();
 const trades=values.map((value,i)=>triggered?after[i]-value:0);
 return {triggered,weights,trades,after};
}

const api={screenFunds,momentum,inverseVolatility,allocateContribution,rebalance};
root.DCAQuantCore=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
