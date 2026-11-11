import test from 'node:test';import assert from 'node:assert/strict';
import {lessons} from '../lessons.js';import {cases} from '../data.js';
import {freshGuided,validateGuided,answer,next,editGuidedRule,runGuidedAction,verifyGuided,exportGuided} from '../guided-engine.js';
test('first-time route gates wrong answers and response actions',()=>{const s=freshGuided();next(s);assert.throws(()=>next(s));answer(s,0);assert.equal(s.records.C02.solved.length,0);assert.throws(()=>next(s));answer(s,1);next(s);assert.equal(s.records.C02.stage,2);assert.throws(()=>runGuidedAction(s));});
test('all ten guided lessons complete with actual state verification',()=>{const s=freshGuided();for(let i=0;i<lessons.length;i++){s.active=i;const l=lessons[i],r=s.records[l.id];next(s);for(const q of l.questions){answer(s,q.answer);next(s);}assert.equal(r.stage,4);for(const a of cases.find(c=>c.id===l.id).actions){if(l.id==='C09'&&a==='test_rule')s.lab.rule={threshold:4,excludeApproved:true};runGuidedAction(s);assert.throws(()=>runGuidedAction(s));next(s);}assert.equal(r.stage,5);assert.throws(()=>next(s));assert.equal(verifyGuided(s),true);next(s);assert.throws(()=>next(s));r.note='I checked the evidence and verified the simulated response before writing this training note.';next(s);assert.equal(r.completed,true);assert.equal(r.stage,7);assert.match(exportGuided(s,l.id),/Fully guided/);assert.ok(validateGuided(s));}});
test('reload preserves the precise action step and separates guided from advanced records',()=>{const s=freshGuided();next(s);for(const q of lessons[0].questions){answer(s,q.answer);next(s);}runGuidedAction(s);const restored=validateGuided(JSON.parse(JSON.stringify(s)));assert.equal(restored.records.C02.stage,4);assert.equal(restored.records.C02.actionDone,true);next(restored);assert.equal(restored.records.C02.actionIndex,1);assert.equal(s.lab.records.C01.audit.length,0);});
test('malformed guided progress is rejected before use',()=>{const s=freshGuided();s.records.C02.stage=999;assert.throws(()=>validateGuided(s));});

test('lesson nine can reopen settings after a failed rule activation and retest', () => {
 const initial = freshGuided();
 initial.active = lessons.findIndex(lesson => lesson.id === 'C09');
 next(initial);
 for (const question of lessons[initial.active].questions) {
  answer(initial, question.answer);
  next(initial);
 }
 runGuidedAction(initial);
 next(initial);
 initial.lab.rule.threshold = 8;
 runGuidedAction(initial);
 next(initial);

 const restored = validateGuided(JSON.parse(JSON.stringify(initial)));
 assert.throws(() => runGuidedAction(restored), /Candidate must reduce/);
 editGuidedRule(restored);
 assert.equal(restored.records.C09.actionIndex, 1);
 assert.equal(restored.records.C09.answers.length, 3);
 assert.equal(restored.lab.records.C09.audit.length, 2);
 restored.lab.rule = {threshold: 4, excludeApproved: true};
 runGuidedAction(restored);
 next(restored);
 runGuidedAction(restored);
 next(restored);
 assert.equal(verifyGuided(restored), true);
});
