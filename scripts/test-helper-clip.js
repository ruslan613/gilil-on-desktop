'use strict';

const fs = require('fs');
const path = require('path');
const helper = require('../server/public/helper-clip');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'server/public/shell-v2.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'server/public/shell-v2.js'), 'utf8');
const src = fs.readFileSync(path.join(root, 'server/public/helper-clip.js'), 'utf8');

let failed = 0;
function check(name, cond) {
  if (cond) console.log('PASS', name);
  else {
    failed += 1;
    console.error('FAIL', name);
  }
}

check('paperclip control and close button exist and start closed', html.includes('id="helper-open"') && html.includes('id="helper-close"') && html.includes('id="helper-panel" class="helper-panel hidden"'));
check('opening is a click, not an automatic popup', js.includes("addEventListener('click', () => {\n        const panel = document.getElementById('helper-panel');\n        setHelperOpen(!(panel && !panel.hidden));") && js.includes("closeBtn.addEventListener('click', () => setHelperOpen(false))"));
check('changing section only refreshes an open tip', js.includes('if (typeof refreshHelper === \'function\') refreshHelper();') && js.includes('if (!signedIn || panel.hidden) return;'));
check('helper does not call the network', !src.includes('fetch(') && !src.includes('XMLHttpRequest') && !src.includes('WebSocket'));

const personal = helper.suggestions('personal', 'ru');
const mail = helper.suggestions('mail', 'ru');
const chats = helper.suggestions('chats', 'en');
check('personal tip names the Who card gear', personal.lead.indexOf('Личная') >= 0 && personal.steps.some((s) => s.indexOf('шестерёнку') >= 0));
check('mail tip is not the personal tip', mail.lead !== personal.lead && mail.steps[0].indexOf('письм') >= 0);
check('english chats tip stays on conversations', chats.lead.indexOf('Projects') >= 0 && chats.steps.some((s) => s.indexOf('conversation') >= 0));
check('chinese personal tip stays on the Who card', helper.suggestions('personal', 'zh').steps[0].indexOf('齿轮') >= 0);
check('unknown section falls back to the open chat screen', helper.suggestions('not-a-section', 'ru').lead === helper.suggestions('chats', 'ru').lead);

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('OK helper clip');
