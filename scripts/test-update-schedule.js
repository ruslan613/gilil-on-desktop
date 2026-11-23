'use strict';

const assert = require('assert');
const { START_DELAY_MS, BACKGROUND_MS, shouldStartCheck, feedUrlAllowed } = require('../update-schedule');

let failed = 0;
function check(name, cond) {
  if (cond) console.log('PASS', name);
  else {
    failed += 1;
    console.error('FAIL', name);
  }
}

check('startup check waits until the window is up', START_DELAY_MS === 4000);
check('background check is four hours', BACKGROUND_MS === 4 * 60 * 60 * 1000);
check('a check already running is not started again', shouldStartCheck('checking') === false);
check('a download in progress is not interrupted', shouldStartCheck('downloading') === false);
check('an idle app can be checked', shouldStartCheck('idle') === true && shouldStartCheck('downloaded') === true);

assert.strictEqual(feedUrlAllowed('https://github.com/ruslan613/gilil-on-desktop/releases/latest/download/latest.yml'), true);
assert.strictEqual(feedUrlAllowed('http://127.0.0.1:9/latest.yml'), true);
assert.strictEqual(feedUrlAllowed('http://example.com/pr-artifact.exe'), false);
assert.strictEqual(feedUrlAllowed('not a url'), false);
check('only HTTPS or localhost may override the release feed', true);

const pkg = require('../package.json');
check('package version is 1.1.5', pkg.version === '1.1.5');
check('uninstall still keeps AppData', pkg.build.nsis.deleteAppDataOnUninstall === false);

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('OK update schedule');
