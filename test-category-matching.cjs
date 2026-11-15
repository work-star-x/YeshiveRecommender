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

run(`
  appData.parameters = [
    { id: 'military', weight: 1 },
    { id: 'rambamizem', weight: 4 }
  ];
  appData.yeshivot = [{
    id: 'test',
    name: 'test',
    profileTags: { military: 10, rambamizem: 1 }
  }];
  state.answers = { q1: 'yes', q16: '1' };
  state.preferredAreaGroups = [];
`);

for (const answer of ['1', '2', '3', '4', 'unknown']) {
  for (const profile of [1, 2, 3, 4]) {
    run(`state.answers.q16 = '${answer}'; appData.yeshivot[0].profileTags.rambamizem = ${profile}`);
    const expected = answer === 'unknown' || Number(answer) === profile
      ? 100
      : profile === 3 && ['1', '2'].includes(answer)
        ? 73.3
        : 20;
    assert.equal(run('computeScores(1)[0].score'), expected, `answer=${answer}, profile=${profile}`);
  }
}

console.log('Category matching tests passed.');
