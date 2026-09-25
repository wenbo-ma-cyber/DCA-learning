'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const base=path.resolve(__dirname,'..'),C=require('../core.js');
const context={window:{}};
for(const file of ['curriculum-1.js','curriculum-2.js','curriculum-3.js','quant-curriculum.js'])vm.runInNewContext(fs.readFileSync(path.join(base,file),'utf8'),context);
const original=[...context.window.DCA_COURSE_1,...context.window.DCA_COURSE_2,...context.window.DCA_COURSE_3];
const quant=context.window.DCA_QUANT_COURSES,ids=[...original,...quant].map(l=>l.id);
assert.equal(original.length,60);assert.equal(quant.length,8);assert.equal(new Set(ids).size,68);
const originalState={...C.empty(),completed:['day-01'],notes:{'day-01':'原有笔记'},visited:['day-01'],lastLesson:'day-01'};
assert.deepEqual(C.validate(originalState,ids),originalState);
const extended={...originalState,completed:['day-01','quant-01'],notes:{...originalState.notes,'quant-01':'<script>这只能显示为文本</script>'},answers:{'quant-01':[0,2]},visited:['day-01','quant-01'],lastLesson:'quant-01'};
assert.deepEqual(C.validate(JSON.parse(JSON.stringify(extended)),ids),extended);
assert.throws(()=>C.validate({...extended,completed:['quant-99']},ids));
assert.throws(()=>C.validate({...extended,answers:{'quant-01':[3,0]}},ids));
assert.equal(C.validate(originalState,ids).completed.filter(id=>id.startsWith('quant-')).length,0);
console.log('✓ 原有 v1 备份兼容，新增进度、笔记与答案可往返校验，未知课程被拒绝');
for(const lesson of quant){
 assert.ok(/^quant-0[1-8]$/.test(lesson.id));
 for(const key of ['title','tagline','formula','code'])assert.ok(typeof lesson[key]==='string'&&lesson[key].length>0,lesson.id+' '+key);
 assert.ok(['基础','策略','验证'].includes(lesson.level));assert.equal(lesson.goals.length,2);
 assert.ok(lesson.sections.length>=2);assert.equal(lesson.quiz.length,2);
 assert.ok(lesson.lab===null||['screen','momentum','risk','rebalance'].includes(lesson.lab));
 for(const q of lesson.quiz){assert.equal(q.options.length,3);assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<3);assert.ok(q.explanation);}
 for(const source of lesson.sources)assert.equal(new URL(source.url).protocol,'https:');
 const run=spawnSync('python3',['-c',lesson.code],{timeout:5000,encoding:'utf8'});
 assert.equal(run.status,0,lesson.id+': '+run.stderr);
 console.log('✓ '+lesson.id+' 内容结构与 Python 示例执行通过');
}
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
for(const [,resource] of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g))assert.ok(fs.existsSync(path.join(base,resource)),'缺少页面资源：'+resource);
assert.ok(html.indexOf('quant-curriculum.js')<html.indexOf('app.js'));
assert.ok(html.includes('href="#quant" data-nav="quant"'));
console.log('✓ 页面资源存在，入口与脚本顺序正确');
