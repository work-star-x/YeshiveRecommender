const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({
  window: {},
  document: { getElementById: () => ({}) },
  console
});
vm.runInContext(fs.readFileSync('data.js', 'utf8'), context);
const app = fs.readFileSync('app.js', 'utf8').replace(/\binitializeApp\(\);\s*$/, '');
vm.runInContext(app, context);

function run(source) {
  return vm.runInContext(source, context);
}

assert.equal(run('appData.yeshivot.length'), 40);
assert.equal(run("appData.yeshivot.filter(y => Number.isInteger(y.profileTags.rambamizem) && Number.isInteger(y.profileTags.intanse_study)).length"), 40);
assert.equal(run("getOrderedQuestions().slice(-2).map(q => q.id).join(',')"), 'q16,q17');
assert.equal(run("appData.parameters.find(p => p.id === 'rambamizem').weight"), 4);
assert.equal(run("appData.parameters.find(p => p.id === 'intanse_study').weight"), 1);
run('validateQuestions(appData.questions); validateParameters(appData.parameters); validateYeshivot(appData.yeshivot)');

run(`
  appData.parameters = [
    { id: 'military', weight: 1 },
    { id: 'rambamizem', weight: 4 },
    { id: 'intanse_study', weight: 1 }
  ];
  appData.yeshivot = [{ id: 'test', name: 'test', profileTags: {
    military: 10, rambamizem: 2, intanse_study: 1
  } }];
  state.answers = { q1: 'yes', q16: '1', q17: '1' };
  state.preferredAreaGroups = [];
`);
assert.equal(run('computeScores(1)[0].score'), 33.3);
run("state.answers.q16 = '2'");
assert.equal(run('computeScores(1)[0].score'), 100);
run("state.answers.q16 = 'unknown'");
assert.equal(run('buildUserProfile().rambamizem'), null);
assert.equal(run('computeScores(1)[0].score'), 100);
run("state.answers.q17 = '10'");
assert.equal(run('computeScores(1)[0].score'), 50);
run("delete appData.yeshivot[0].profileTags.intanse_study");
assert.equal(run('computeScores(1)[0].score'), 100);
run("state.answers.q16 = '1'");
assert.equal(run('computeScores(1)[0].score'), 20);
run("appData.parameters.find(p => p.id === 'rambamizem').weight = 1");
assert.equal(run('computeScores(1)[0].score'), 50);
assert.throws(() => run("appData.parameters[0].weight = -1; computeScores(1)"), /משקל לא תקין/);

console.log('Study parameter scoring and validation tests passed.');
