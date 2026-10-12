// THROWAWAY UI only. No fetch, real authentication, persistence, or production integration.
const variants = {
  A: ['Four destinations', 'Persistent Jobs / Time / Sync / Account tabs. Inside a Job: Overview combines work and context, with separate Files and Billing tabs.'],
  B: ['Workday first', 'A next-Job focus and appointment timeline. A persistent timer and toolbar open global tools. Job information uses expandable sections.'],
  C: ['Compact directory', 'A dense Job directory with a menu for global tools. Job details start with a section index instead of showing all content at once.'],
};
const initialVariant = new URL(location.href).searchParams.get('variant');
const initialScreen = new URL(location.href).searchParams.get('screen');
const state = {
  variant: variants[initialVariant] ? initialVariant : 'A', page: ['job','sync'].includes(initialScreen) ? initialScreen : 'jobs', scenario: 'online',
  section: new URL(location.href).searchParams.get('section') === 'Billing' ? 'Billing' : 'Work', menu: false, filter: 'Daily', timer: 'Job 1042', timerPending: false,
  notes: 'Check inlet seal and record pressure.', conflict: false, document: 'Invoice',
  docState: 'Draft', setup: 0, pinned: false, paymentPending: false, serviceEntry: false, subtask: false, recoveryIndex: 0,
  queue: [{title: 'Photo · Job 1042', group: 'Waiting', detail: 'Waiting to upload · publication not confirmed'}],
};
const makeDocument = (id, kind, number, title, lines) => ({id, kind, number, title, status:'Draft', pending:false, lines, date:'2026-10-12', due:'', notes:'', terms:'Payment due within 30 days.', delivery:'No delivery requested', paymentPending:false});
state.documents = [
  makeDocument('invoice', 'Invoice', 'INV-0184', 'Pump inspection', [{description:'Inspection labour', quantity:2, rate:120}]),
  makeDocument('estimate', 'Estimate', 'EST-0092', 'Replacement inlet seal', [{description:'Seal kit and fitting', quantity:1, rate:180}]),
];
state.documents[0].source = 'EST-0091';
state.activeDocument = 'invoice';
state.editor = null;
state.lineDraft = null;
state.lineIndex = null;
const currentDocument = () => state.documents.find(d => d.id === state.activeDocument);
const total = document => document.lines.reduce((sum, line) => sum + line.quantity * line.rate, 0);
const money = value => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'}).format(value);
function selectDocument(id) { state.activeDocument=id; state.document=currentDocument().kind; state.page='document'; }
function queueDocument(title, detail = 'Pending sync · server has not confirmed this action') {
  const document=currentDocument(); enqueue(`${title} · ${document.number || 'New '+document.kind}`, detail);
  state.queue.at(-1).docId=document.id; document.pending=true;
}
const app = document.querySelector('#app');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button = (text, attrs = '', cls = '') => `<button class="${cls}" ${attrs}>${text}</button>`;
const go = (label, page, cls = '') => button(label, `data-go="${page}"`, cls);
const action = (label, key, cls = '') => button(label, `data-action="${key}"`, cls);
const canBill = () => state.scenario !== 'restricted';
const connected = () => !['offline', 'expired'].includes(state.scenario);
const tell = text => { document.querySelector('#message').textContent = text; };
function enqueue(title, detail = 'Pending sync · server has not confirmed this action') {
  state.queue.push({title, group: 'Waiting', detail});
  tell(`${title}: saved to the simulated queue.`);
}
function navigate(page) {
  if (state.editor && !['documentEditor','lineEditor','pricebook'].includes(page)) {
    review('Leave this draft?', 'Unsaved document edits will be discarded. Cancel to keep editing.', () => {state.editor=null;state.lineDraft=null;state.page=page;state.menu=false;});
    return;
  }
  state.page = page; state.menu = false; render();
}
function review(title, copy, confirm) {
  document.querySelector('#review-title').textContent = title;
  document.querySelector('#review-copy').textContent = copy;
  document.querySelector('#review-confirm').onclick = () => { document.querySelector('#review').close(); confirm(); render(); };
  document.querySelector('#review').showModal();
}
const jobRow = (label, info) => go(`<strong>${label}</strong><small>${info}</small>`, 'job', 'job');
function navigation() {
  return `<nav class="nav" aria-label="App destinations">${[['Jobs','jobs'],['Time','time'],['Sync','sync'],['Account','account']].map(([name,page]) => button(name, `data-go="${page}" ${state.page === page ? 'aria-current="page"' : ''}`)).join('')}</nav>`;
}
function render() {
  const [name, description] = variants[state.variant];
  document.querySelector('#variant-title').textContent = `${state.variant} · ${name}`;
  document.querySelector('#variant-label').textContent = `${state.variant} · ${name}`;
  document.querySelector('#variant-description').textContent = description;
  const connection = connected() ? 'Online · updated 09:12 (sample)' : state.scenario === 'expired' ? 'Offline authorization expired' : 'Offline · updated 08:40 · lease 6h left';
  const tools = state.variant === 'A' ? '' : state.variant === 'B'
    ? `<div class="row" style="padding:8px">${go('Workday','jobs')}${go('Time','time')}${go('Sync','sync')}${go('Account','account')}</div>`
    : state.menu ? `<div class="drawer stack">${go('Jobs','jobs')}${go('Time','time')}${go('Sync activity','sync')}${go('Account & sessions','account')}</div>` : '';
  const title = state.variant === 'B' ? 'My workday' : 'FreeFSM';
  const head = `<header class="app-header">${state.variant === 'C' ? button('☰', 'data-action="menu" aria-label="Open app menu"') : ''}<strong>${title}</strong><span class="badge">Demo</span></header>`;
  const banner = `<div class="connection"><span>${connection}</span>${go(`${state.queue.filter(q=>q.group!=='Completed').length} pending`, 'sync')}</div>`;
  const expired = `<div class="empty"><h1>Reconnect to continue</h1><p>Your offline authorization has expired. Business data is locked; pending work is retained under the agreed lifecycle rules.</p>${action('Simulate successful reauthorization','reauthorize','primary')}</div>`;
  const screens = {jobs: jobsScreen, job: jobScreen, time: timeScreen, sync: syncScreen, recovery: recoveryScreen, conflict: conflictScreen, account: accountScreen, connect: connectScreen, document: documentScreen, documentEditor: documentEditorScreen, lineEditor: lineEditorScreen, pricebook: pricebookScreen, asset: assetScreen};
  app.innerHTML = head + (state.page !== 'connect' ? banner : '') + (state.scenario === 'expired' ? '' : tools) +
    (state.variant === 'B' && state.scenario !== 'expired' && state.page !== 'connect' ? button(`${state.timer ? 'Running: '+esc(state.timer) : 'No timer running'}${state.timerPending ? ' · local change pending' : ''}`, 'data-go="time"', 'timer-strip') : '') +
    `<div class="content">${state.scenario === 'expired' && state.page !== 'connect' ? expired : (screens[state.page] || jobsScreen)()}</div>` +
    (state.scenario !== 'expired' && canBill() && state.page === 'documentEditor' ? `<div class="editor-actions"><span class="muted">${money(total(state.editor))} · not yet saved</span>${action('Save changes','saveDocument','primary')}</div>` : '') +
    (state.scenario !== 'expired' && canBill() && state.page === 'lineEditor' ? `<div class="editor-actions"><span class="muted">Return to document draft</span>${action('Apply line','applyLine','primary')}</div>` : '') +
    (state.variant === 'A' && state.scenario !== 'expired' && state.page !== 'connect' ? navigation() : '');
  const visibleState = {...state};
  if (state.scenario === 'expired') { visibleState.notes = '[locked in simulated app]'; }
  document.querySelector('#state').textContent = JSON.stringify(visibleState, null, 2);
}
function jobsScreen() {
  if (state.scenario === 'empty') return `<h1>Jobs</h1><div class="empty"><h2>No Jobs available</h2><p>No Jobs were returned for your current access and filters.</p>${action('Refresh sample','syncNow')}${go('Standalone time','time')}</div>`;
  const filters = `<div class="tabs" aria-label="Job filters">${['Daily','Future','Completed'].map(f => button(f, `data-filter="${f}"`, state.filter === f ? 'selected' : '')).join('')}</div>`;
  if (state.filter !== 'Daily') return `<h1>${state.filter} Jobs</h1>${filters}<div class="empty">No ${state.filter.toLowerCase()} Jobs in this sample.</div>`;
  if (state.variant === 'B') return `<small>Monday · fictional schedule</small><h1>Start with the next Job</h1><div class="hero"><span class="badge">09:00–10:30 · In progress</span><h2>Pump inspection</h2><p>Job 1042 · Riverside Workshop</p>${go('Continue this Job','job','primary wide')}</div><h2>Rest of the day</h2><div class="timeline">${jobRow('11:00 · Filter replacement','Job 1043 · Hilltop Clinic')}${jobRow('Overdue · Pressure test','Job 1039 · East Depot')}</div>${filters}${jobRow('Unscheduled · Site check','Job 1046 · West Store')}`;
  if (state.variant === 'C') return `<h1>Jobs</h1><p class="muted">Daily directory · 4 visible Jobs</p>${filters}<div class="directory">${jobRow('1042 · Pump inspection','TODAY 09:00 · Riverside · In progress')}${jobRow('1043 · Filter replacement','TODAY 11:00 · Hilltop · Scheduled')}${jobRow('1039 · Pressure test','OVERDUE · East Depot')}${jobRow('1046 · Site check','UNSCHEDULED · West Store')}</div><p class="caption">Only Job 1042 has a worked-through detail fixture; all rows open it in this study.</p>`;
  return `<h1>Your Jobs</h1>${filters}<h2>Today</h2>${jobRow('Pump inspection','09:00 · Job 1042 · Riverside Workshop')}${jobRow('Filter replacement','11:00 · Job 1043 · Hilltop Clinic')}<h2>Overdue</h2>${jobRow('Pressure test','Job 1039 · East Depot')}<h2>Unscheduled</h2>${jobRow('Site check','Job 1046 · West Store')}`;
}
function commentsSection() {
  return `<h2>Comments</h2><p class="card">Alex · 08:10<br>Please record the outlet pressure.</p>${action('Add Comment / reply','comment')}`;
}
function workSection(showComments = true) {
  return `<h2>Work</h2><div class="row">${action('Change Status','status')}${go('View timer','time')}</div><p class="caption">Status and time are separate actions.</p><label class="row"><input type="checkbox" id="subtask" ${state.subtask?'checked':''}> Inspect inlet seal</label><label class="field">Field Notes<textarea id="notes">${esc(state.notes)}</textarea></label>${action('Save Field Notes','saveNotes','primary')}<label class="field">Custom Field · Access instructions<input value="Call reception on arrival" id="custom"></label>${action('Save Custom Field','custom')}${showComments ? commentsSection() : ''}`;
}
function overviewSection() {
  return workSection(false) + `<details class="card"><summary><strong>Customer, Project & Assets</strong></summary><dl class="facts"><dt>Customer</dt><dd>Riverside Workshop</dd><dt>Project</dt><dd>Autumn maintenance</dd></dl>${go('Pump P-12 · service history','asset','wide')}<h3 style="margin-top:16px">Other context</h3>${action('Open assignment in FreeFSM','web')}<p class="caption">External browser · internet and separate sign-in may be required.</p></details>` + commentsSection();
}
function contextSection() { return `<h2>Context</h2><dl class="facts"><dt>Customer</dt><dd>Riverside Workshop</dd><dt>Location</dt><dd>14 Wharf Road</dd><dt>Contact</dt><dd>Alex · reception</dd><dt>Project</dt><dd>Autumn maintenance</dd></dl>${go('Pump P-12 · service history','asset','wide')}<h2>Other work</h2>${action('Open assignment in FreeFSM','web')}<p class="caption">External browser · internet and separate sign-in may be required.</p>`; }
function filesSection() { return `<h2>Files</h2><div class="card"><strong>inlet-photo.jpg</strong><p>Local photo · waiting to upload</p><span class="badge">Not yet published</span></div><div class="card"><strong>service-manual.pdf</strong><p>${state.pinned ? 'Waiting for download · not ready offline' : 'Not downloaded'}</p>${action('Keep available offline','pin')}</div>${action('Keep all Job attachments offline','pin')}<div class="row" style="margin-top:12px">${action('Take photo','photo')}${action('Attach File','photo')}</div>`; }
function billingSection() {
  return `<div class="row spread"><h2>Billing</h2><small>All Job documents</small></div><div class="row">${action('New Estimate','estimate')}${action('New Invoice','newInvoice')}</div>${state.documents.map(document => `<article class="card"><div class="row spread"><strong>${esc(document.kind)} · ${esc(document.number || 'Not numbered yet')}</strong><span>${money(total(document))}</span></div><p>${esc(document.title)}</p><div class="row"><span class="badge">${esc(document.status)}</span>${document.pending ? '<span class="badge">Pending sync</span>' : ''}</div><p>${button('Open '+esc(document.kind),`data-document="${document.id}"`)}</p>${document.source ? button('From Estimate '+esc(document.source),`data-provenance="${esc(document.source)}"`,'small-action') : ''}</article>`).join('')}<p class="caption">Customer-only Invoice creation awaits an upstream extension.</p>`;
}
function jobScreen() {
  const sections = {...(state.variant === 'A' ? {Overview:overviewSection} : {Work:workSection, Context:contextSection}), Files:filesSection, ...(canBill() ? {Billing:billingSection} : {})};
  if (!sections[state.section] && !(state.variant === 'C' && state.section === 'Index')) state.section = state.variant === 'A' ? 'Overview' : 'Work';
  const pending = state.queue.some(q => q.title.includes('Notes') && q.group !== 'Completed');
  const summary = state.variant === 'A' ? `<div class="job-summary"><div class="row spread"><span class="badge">In progress</span><small>Today · 09:00–10:30</small></div><p>14 Wharf Road</p><details><summary>Contact · Alex, reception</summary><p class="caption">Check in at reception and ask for Alex. Contact actions will use the details provided by FreeFSM.</p></details></div>` : '<span class="badge">In progress</span>';
  const header = `${go('← Jobs','jobs','back')}<small>JOB 1042 · RIVERSIDE WORKSHOP</small><h1>Pump inspection</h1>${summary}${state.conflict ? `<div class="notice">Field Notes need review. ${go('Compare changes','conflict')}</div>` : pending ? `<div class="notice">Field Notes · Pending sync ${go('View activity','sync')}</div>` : ''}`;
  if (state.variant === 'B') return header + Object.entries(sections).map(([key,fn])=>`<details class="card" ${key===state.section?'open':''}><summary><strong>${key}</strong></summary>${fn()}</details>`).join('');
  if (state.variant === 'C' && state.section === 'Index') return header + `<h2>Job sections</h2><div class="stack detail-menu">${Object.keys(sections).map(s=>button(`${s} →`,`data-section="${s}"`)).join('')}</div>`;
  return header + (state.variant==='C' ? button('← Job sections','data-section="Index"','back') : `<nav class="tabs">${Object.keys(sections).map(s=>button(s,`data-section="${s}"`,s===state.section?'selected':'')).join('')}</nav>`) + sections[state.section]();
}
function timeScreen() { return `<h1>Time</h1><div class="card"><h2>${state.timer ? 'Timer running' : 'No active timer'}</h2><p>${esc(state.timer || 'Start standalone time or open a Job.')}</p>${state.timerPending ? '<span class="badge">Local timer change · Pending sync</span>' : '<small>Sample elapsed time: 00:42</small>'}</div><div class="stack">${state.timer ? action('Clock out','clockOut','primary') : action('Clock in to Job 1042','clockIn','primary')}${action(state.timer ? 'Switch to standalone time…' : 'Start standalone time','standalone')}</div><p class="caption">No Job Status is changed by these actions. Clock-out targets the original Time Entry.</p>${action('Correct time in FreeFSM','web')}`; }
function syncScreen() {
  const items = group => state.queue.filter(q=>q.group===group);
  const cards = group => items(group).map(q=>`<div class="card"><strong>${esc(q.title)}</strong><p>${esc(q.detail)}</p>${q.unknown ? '<p class="caption">The app is investigating. Do not submit a replacement while the outcome is unknown.</p>' : ''}${button(q.conflict?'Review conflict':q.unknown?'Check outcome':'View details',`data-recovery="${state.queue.indexOf(q)}"`)}</div>`).join('') || '<p class="muted">None</p>';
  return `<h1>Sync activity</h1><p class="muted">Confirmed snapshot: 09:12 (sample)</p>${action('Sync now · simulate outcomes','syncNow','primary')}<p class="caption">This button simulates confirmation of safe sample operations; it does not contact a server.</p>${['Needs attention','Syncing','Waiting'].filter(group=>group!=='Needs attention'||items(group).length).map(group=>`<h2>${group}</h2>${cards(group)}`).join('')}<details class="card"><summary><strong>Completed (${items('Completed').length})</strong></summary>${cards('Completed')}</details><div class="stack action-footer">${action('Try Field Notes conflict','seedConflict')}${canBill() ? action('Try unknown Payment outcome','unknown') : ''}</div>`;
}
function conflictScreen() { return `${go('← Sync activity','sync','back')}<h1>Review Field Notes</h1><span class="badge">Conflict · needs your review</span><h2>What happened</h2><p>Job 1042 has newer Field Notes than the version you edited.</p>${go('Open affected Job','job')}<h2>Blocked follow-up actions</h2><p class="muted">None in this sample. Other independent work can continue syncing.</p><h2>Compare and revise</h2><div class="compare"><h3>Current server version</h3>Seal replaced by Alex. Pressure check still needed.</div><label class="field">Your change<textarea id="resolution">${esc(state.notes)}</textarea></label><p class="caption">Original: Check inlet seal and record pressure. Resubmission is a new operation; it is not a force overwrite.</p><div class="stack">${action('Review revised submission','resolve','primary')}${action('Discard my change','discard')}</div>`; }
function recoveryScreen() {
  const item=state.queue[state.recoveryIndex];
  if(!item) return `${go('← Sync activity','sync','back')}<h1>Item no longer in this queue</h1><p>Return to current activity to check its state.</p>`;
  if(item.conflict) return conflictScreen();
  return `${go('← Sync activity','sync','back')}<h1>${item.unknown?'Checking outcome':'Sync details'}</h1><span class="badge">${esc(item.group)}</span><h2>Affected action</h2><p>${esc(item.title)}</p>${item.unknown?button('Open affected Invoice','data-document="invoice"'):go('Open affected Job','job')}<h2>What happened</h2><p>${esc(item.detail)}</p>${item.unknown?'<div class="notice">The server may have recorded this Payment before the response was lost. The app is checking the original operation. Do not submit a replacement.</div>':''}<h2>Blocked follow-up actions</h2><p>${item.unknown?'A replacement Payment stays unavailable until the original outcome is established. No dependent queued actions in this sample.':'None in this sample. Independent work may continue.'}</p><h2>Next steps</h2>${item.unknown?`<p>${connected()?'Check the original receipt again. This demo has no server receipt to confirm.':'Reconnect to check the original receipt. Waiting offline is not a rejection.'}</p>${action('Check status','checkOutcome','primary')}<p class="notice" role="status">${esc(item.lastCheck || 'No replacement submission is available.')}</p>`:'<p>Use Sync activity to monitor this operation. No additional recovery action is needed in this sample.</p>'}`;
}
function documentScreen() {
  if (!canBill()) return `<h1>Document unavailable</h1><p>You do not have access to this document. Its contents are not shown.</p>${go('Return to Job','job')}`;
  const document=currentDocument();
  return `${action('← Billing','backBilling','back')}<div class="row spread"><h1>${esc(document.number || 'New '+document.kind)}</h1>${action('Edit','editDocument','primary')}</div><p>${esc(document.kind)} · ${esc(document.title)}</p><div class="row"><span class="badge">${esc(document.status)}</span>${document.pending ? '<span class="badge">Pending sync</span>' : ''}</div>${document.pending ? '<p class="notice">Local changes shown. Server confirmation is still pending.</p>' : ''}<dl class="facts"><dt>Customer</dt><dd>Riverside Workshop</dd><dt>Job</dt><dd>1042 · Pump inspection</dd><dt>Date</dt><dd>${esc(document.date)}</dd><dt>${document.kind==='Invoice'?'Due':'Valid through'}</dt><dd>${esc(document.due || 'Not set')}</dd></dl><h2>Line items</h2>${document.lines.map(line=>`<div class="card"><div class="row spread"><strong>${esc(line.description)}</strong><span>${money(line.quantity*line.rate)}</span></div><small>${line.quantity} × ${money(line.rate)}</small></div>`).join('') || '<p>No line items.</p>'}<h2>Total · ${money(total(document))}</h2><p class="caption">Sample uses USD with no tax or adjustments.</p><details><summary>Notes & terms</summary><p>${esc(document.notes || 'No notes')}</p><p>${esc(document.terms || 'No terms')}</p></details><h2>Delivery${document.kind==='Invoice'?' & payment':''}</h2><p>${esc(document.delivery)}</p>${document.kind==='Invoice'?`<p>${document.status==='Draft'?'Draft · no collectible amount due':document.paymentPending?'Payment pending · confirmed amount due unchanged':'No Payment recorded'}</p>`:''}${document.source ? button('Conversion history · '+esc(document.source),`data-provenance="${esc(document.source)}"`,'wide') : ''}<div class="stack action-footer">${document.kind==='Estimate' ? action('Record acceptance','accept')+action('Convert to Draft Invoice','convert') : action('Review finalization','finalize')}${action('Review email delivery','email')}${action('Preview PDF','pdf')}${document.kind==='Invoice'?(document.status==='Draft'?button('Record Payment','disabled aria-describedby="payment-reason"')+'<small id="payment-reason">Available after server-confirmed finalization and a positive amount due.</small>':action('Record Payment','payment')):''}</div><p class="caption">Actions stay separate and require current server permission.</p>`;
}
function assetScreen() { return `${go('← Job','job','back')}<h1>Pump P-12</h1><h2>Service history</h2><div class="card">Last visit · Seal inspected. No leak found.</div>${state.serviceEntry ? '<div class="notice">New Service Entry · Pending sync</div>' : ''}${action('New Asset Service Entry','service','primary')}<p class="caption">Equipment-specific history, distinct from Job Field Notes.</p>`; }
function accountScreen() { return `<h1>Account & sessions</h1><div class="card"><strong>Jamie Morgan</strong><p>https://demo.freefsm.example</p><small>Offline authorization: ${connected()?'24 hours (sample)':'6 hours (sample)'}</small></div><h2>Sessions</h2><div class="card">Field phone · this device</div><div class="card">Previous phone${action('Revoke this session','revoke')}</div><div class="stack">${action('Revoke all sessions','logout')}${action('Log out / change connection','logout')}${go('Replay onboarding','connect')}</div><p class="caption">Business data and pending work are cleared on confirmed local logout. An unreachable server is not a logout.</p>`; }
function connectScreen() {
  const steps = [
    `<h1>Connect FreeFSM</h1><label class="field">Server URL<input id="server-url" type="url" value="https://demo.freefsm.example"></label><p>HTTPS with a trusted certificate is required.</p>${action('Check compatibility · simulate','setupNext','primary')}<p class="caption">This fixture does not make a network request.</p>`,
    `<h1>Compatible server</h1><p>Sign in and approve access in your browser. Your password is never entered in this app.</p>${action('Simulate browser approval','setupNext','primary')}`,
    `<h1>Is this your account?</h1><div class="card">Jamie Morgan<br>demo.freefsm.example</div>${action('Confirm and download','setupNext','primary')}${action('Wrong account · restart','setupReset')}`,
    `<h1>Prepare offline data</h1><p>Download a complete, consistent starting snapshot before opening the workspace. Attachments download separately.</p><progress max="100" value="65" aria-label="Simulated initial download progress"></progress><p>65% · simulated progress</p>${action('Simulate complete download','setupFinish','primary')}`,
  ];
  return steps[state.setup];
}
function documentEditorScreen() {
  if (!canBill()) return '<h1>Editing unavailable</h1><p>Commercial permission is required.</p>';
  if (!state.editor) return '<h1>No document draft</h1>';
  const draft=state.editor;
  return `${action('Cancel editing','cancelDocument','back')}<h1>Edit ${esc(draft.kind)}</h1><p class="muted">${esc(draft.number || 'Number assigned after server acceptance')}</p><h2>Details</h2><p>Riverside Workshop · Job 1042</p><label class="field">Title<input id="document-title" data-draft="title" required value="${esc(draft.title)}"></label><div class="grid"><label class="field">Date<input type="date" data-draft="date" value="${esc(draft.date)}"></label><label class="field">${draft.kind==='Invoice'?'Due date':'Valid through'}<input type="date" data-draft="due" value="${esc(draft.due)}"></label></div><label class="field">Notes<textarea data-draft="notes">${esc(draft.notes)}</textarea></label><h2>Line items</h2><div class="stack">${draft.lines.map((line,index)=>button(`<strong>${esc(line.description)}</strong><small>${line.quantity} × ${money(line.rate)} · ${money(line.quantity*line.rate)}</small>`,`data-edit-line="${index}"`,'job')).join('') || '<p>No items yet. Add a pricebook item or a custom line.</p>'}</div><div class="row">${action('From Pricebook','pricebook')}${action('Custom line','customLine')}</div><h2>Totals & terms</h2><div class="row spread"><strong>Total</strong><strong>${money(total(draft))}</strong></div><p class="caption">This sample shows no tax or adjustments; complete tax/adjustment controls are outside this screen trial.</p><label class="field">Terms<textarea data-draft="terms">${esc(draft.terms)}</textarea></label><p class="notice">Save changes stores this document locally as Pending sync. It does not finalize, email or record a Payment.</p>`;
}
function lineEditorScreen() {
  if (!canBill() || !state.editor || !state.lineDraft) return '<h1>Line editor unavailable</h1>';
  const line=state.lineDraft;
  return `${action('← Document draft','cancelLine','back')}<h1>${state.lineIndex===null?'Add':'Edit'} line item</h1><p class="muted">Changes apply to the unsaved document draft.</p><label class="field">Description<textarea id="line-description" data-line="description" required>${esc(line.description)}</textarea></label><div class="grid"><label class="field">Quantity<input id="line-quantity" type="number" min="0" step="any" data-line="quantity" required value="${line.quantity}"></label><label class="field">Unit price · USD<input id="line-rate" type="number" min="0" step="0.01" data-line="rate" required value="${line.rate}"></label></div><p>Line total: <strong id="line-total">${money(line.quantity*line.rate)}</strong></p>${state.lineIndex!==null?action('Remove from this draft','removeLine'):''}`;
}
const catalog = [
  {description:'Inspection labour',quantity:1,rate:120},
  {description:'Replacement seal kit',quantity:1,rate:60},
  {description:'Pressure test',quantity:1,rate:90},
];
function pricebookScreen() {
  if (!canBill() || !state.editor) return '<h1>Pricebook unavailable</h1>';
  return `${action('← Document draft','cancelLine','back')}<h1>Select an Item</h1><p class="caption">Fictional authorized pricebook. Review the line before adding it.</p>${catalog.map((line,index)=>button(`<strong>${esc(line.description)}</strong><small>${money(line.rate)}</small>`,`data-catalog="${index}"`,'job')).join('')}`;
}
function beginDocument(kind) {
  state.editor=makeDocument(`local-${state.documents.length}`,kind,'',`New ${kind}`,[]);
  state.page='documentEditor';
}
const handlers = {
  menu: () => {state.menu=!state.menu;},
  saveNotes: () => {state.notes=document.querySelector('#notes').value; enqueue('Field Notes · Job 1042');},
  custom: () => enqueue('Custom Field · Job 1042'),
  comment: () => review('Add Comment', 'A real screen will offer text and replies. Queue the fictional comment “Pressure check complete”?',()=>enqueue('Comment · Job 1042')),
  photo: () => review('Attach a sample photo', 'Camera/file selection is simulated. No device permission is requested.',()=>enqueue('Photo · Job 1042','Local bytes retained · upload and publication pending')),
  pin: () => {state.pinned=true; tell('Marked for offline download. Not downloaded in this prototype.');},
  invoice: () => selectDocument('invoice'),
  estimate: () => beginDocument('Estimate'),
  newInvoice: () => beginDocument('Invoice'),
  backBilling: () => {state.section='Billing';state.page='job';},
  editDocument: () => {state.editor=structuredClone(currentDocument());state.page='documentEditor';},
  cancelDocument: () => review('Discard unsaved edits?', 'The saved document stays unchanged. Cancel to continue editing.',()=>{const existing=state.documents.some(d=>d.id===state.editor.id);state.editor=null;state.lineDraft=null;state.page=existing?'document':'job';state.section='Billing';}),
  saveDocument: () => {
    if (!document.querySelector('#document-title').reportValidity()) return false;
    const index=state.documents.findIndex(d=>d.id===state.editor.id);
    const saved=structuredClone(state.editor);
    if(index<0) state.documents.push(saved); else state.documents[index]=saved;
    state.activeDocument=saved.id;state.document=saved.kind;
    queueDocument(index<0?'Create document':'Edit document');
    state.editor=null;state.lineDraft=null;state.page='document';
  },
  pricebook: () => {state.page='pricebook';},
  customLine: () => {state.lineIndex=null;state.lineDraft={description:'',quantity:1,rate:0};state.page='lineEditor';},
  cancelLine: () => {state.lineDraft=null;state.page='documentEditor';},
  applyLine: () => {
    for(const id of ['line-description','line-quantity','line-rate']) if(!document.getElementById(id).reportValidity()) return false;
    if(state.lineIndex===null) state.editor.lines.push({...state.lineDraft}); else state.editor.lines[state.lineIndex]={...state.lineDraft};
    state.lineDraft=null;state.page='documentEditor';
  },
  removeLine: () => {state.editor.lines.splice(state.lineIndex,1);state.lineDraft=null;state.page='documentEditor';},
  accept: () => review('Record Estimate acceptance', 'Manually record acceptance through a permitted transition. Email delivery does not imply acceptance.',()=>queueDocument('Estimate acceptance','Acceptance pending · confirmed status unchanged')),
  convert: () => review('Convert Estimate', 'Create a new Draft Invoice after server acceptance. Finalization, email and Payment remain separate. This demo queues the request without inventing a server number.',()=>queueDocument('Estimate conversion','Conversion pending · await server-created Invoice')),
  finalize: () => review('Review finalization', `${currentDocument().number || 'New Invoice'} · Riverside · ${money(total(currentDocument()))}. Queue finalization without sending? Current server prerequisites still apply.`,()=>queueDocument('Invoice finalization','Finalization pending · confirmed status unchanged')),
  email: () => review('Review Document Delivery', `To: accounts@riverside.example · ${currentDocument().number || 'New document'}. Server acceptance and actual delivery are distinct.`,()=>{currentDocument().delivery='Pending send · not yet accepted or delivered';queueDocument('Document Delivery','Pending send · prerequisite and reviewed snapshot must still be valid');}),
  pdf: () => review('PDF preview', 'Placeholder for a server-generated PDF and its version. An offline copy may be older than local edits; generating a new PDF requires connectivity.',()=>tell('PDF preview is a placeholder in this navigation study.')),
  payment: () => review('Record external Payment', `Sample: $120.00 cash against ${currentDocument().number}. No money is collected by the app. Fixed amount and target; current due must permit it.`,()=>{currentDocument().paymentPending=true;queueDocument('Payment','Fixed $120.00 · awaiting server confirmation');}),
  status: () => review('Mark Job complete', `${state.timer==='Job 1042'?'Your Job timer is still running. Completion will not stop it. ':''}Queue a permitted completion transition?`,()=>enqueue('Job completion · Job 1042')),
  clockOut: () => review('Clock out', `Target: ${state.timer}. Job Status remains unchanged.`,()=>{enqueue('Clock-out · '+state.timer);state.timer=null;state.timerPending=true;}),
  clockIn: () => {enqueue('Clock-in · Job 1042');state.timer='Job 1042';state.timerPending=true;},
  standalone: () => review(state.timer?'Clock out, then start standalone time':'Start standalone time',state.timer?'Two separate operations. The new clock-in must wait for the old clock-out to succeed.':'No Job is required.',()=>{if(state.timer)enqueue('Clock-out · '+state.timer);enqueue('Standalone clock-in',state.timer?'Waiting for previous clock-out confirmation':'Pending sync');state.timer='Standalone (pending)';state.timerPending=true;}),
  service: () => review('Asset Service Entry', 'Queue a sample equipment-specific entry for Pump P-12: “Seal inspected; pressure recorded.”',()=>{state.serviceEntry=true;enqueue('Asset Service Entry · Job 1042');}),
  web: () => review('Open in FreeFSM', 'An actual app opens a supported authorized link in the external browser. This demo opens no real site.',()=>tell('External navigation simulated.')),
  revoke: () => review('Revoke previous phone', 'This would revoke that session only. This phone remains signed in.',()=>tell('Previous-phone revocation simulated.')),
  logout: () => review('Discard pending work and log out?', 'In the real app: sync first, cancel, or explicitly discard. Clearing local intent does not undo possible server effects. This demo clears its queue only; it cannot revoke a real session.',()=>{state.queue=[];state.setup=0;state.page='connect';}),
  setupNext: () => {state.setup=Math.min(3,state.setup+1);}, setupReset: () => {state.setup=0;},
  setupFinish: () => {state.scenario='online';document.querySelector('#scenario').value='online';state.page='jobs';tell('Initial snapshot completion simulated.');},
  reauthorize: () => {state.scenario='online';document.querySelector('#scenario').value='online';tell('Successful reauthorization simulated.');},
  seedConflict: () => {state.conflict=true; if(!state.queue.some(q=>q.conflict))state.queue.push({title:'Field Notes · Job 1042',group:'Needs attention',detail:'Server version changed · review required',conflict:true});state.page='sync';},
  unknown: () => {state.queue.push({title:'Payment · INV-0184',group:'Needs attention',detail:'Checking outcome · do not submit a replacement',unknown:true});tell('Unknown outcome added. This demo never fabricates a successful receipt.');},
  checkOutcome: () => {const item=state.queue[state.recoveryIndex];if(item?.unknown){item.lastCheck=connected()?'Status check simulated: no receipt is available in this demo. Outcome remains unknown.':'Offline: waiting for a connection to check the original operation.';tell(item.lastCheck);}},
  resolve: () => {const revised=document.querySelector('#resolution').value;review('Submit revised Field Notes?', 'Use a new operation after reviewing the current version. This does not force an overwrite.',()=>{state.notes=revised;state.conflict=false;state.queue=state.queue.filter(q=>!q.conflict);enqueue('Revised Field Notes · Job 1042');state.page='sync';});},
  discard: () => review('Discard conflicting local edit?', 'Use the current authorized server version. No server action is reversed.',()=>{state.notes='Seal replaced by Alex. Pressure check still needed.';state.conflict=false;state.queue=state.queue.filter(q=>!q.conflict);state.page='job';}),
  syncNow: () => {if(!connected()){tell('Offline: waiting for connectivity. No operations confirmed.');return;}for(const q of state.queue){if(q.group==='Waiting' && /^(Field Notes|Revised Field Notes|Comment|Custom Field|Subtask)/.test(q.title)){q.group='Completed';q.detail='Server acceptance simulated';}}tell('Simple edits confirmed in the simulation. Financial, dependency and File outcomes stay pending; this is not a protocol simulator.');},
};
document.addEventListener('click', event => {
  const element = event.target.closest('button'); if(!element) return;
  if(element.dataset.go){ if(element.dataset.go==='job' && state.variant==='C')state.section='Index';navigate(element.dataset.go); }
  if(element.dataset.section){state.section=element.dataset.section;render();}
  if(element.dataset.filter){state.filter=element.dataset.filter;render();}
  if(element.dataset.document){selectDocument(element.dataset.document);render();}
  if(element.dataset.recovery!==undefined){state.recoveryIndex=Number(element.dataset.recovery);navigate('recovery');}
  if(element.dataset.provenance){review('Conversion history',`${element.dataset.provenance} → INV-0184. This represents an authorized source snapshot, not an ordinary editable converted Estimate.`,()=>tell('Conversion provenance inspected.'));}
  if(element.dataset.editLine!==undefined){state.lineIndex=Number(element.dataset.editLine);state.lineDraft={...state.editor.lines[state.lineIndex]};state.page='lineEditor';render();}
  if(element.dataset.catalog!==undefined){state.lineIndex=null;state.lineDraft={...catalog[Number(element.dataset.catalog)]};state.page='lineEditor';render();}
  if(element.dataset.action){const result=handlers[element.dataset.action]?.();if(result!==false)render();}
});
document.addEventListener('input',event=>{
  const input=event.target;
  if(input.dataset.draft && state.editor) state.editor[input.dataset.draft]=input.value;
  if(input.dataset.line && state.lineDraft){state.lineDraft[input.dataset.line]=input.dataset.line==='description'?input.value:Number(input.value);document.querySelector('#line-total').textContent=money(state.lineDraft.quantity*state.lineDraft.rate);}
});
document.addEventListener('change', event => {if(event.target.id==='subtask'){state.subtask=event.target.checked;enqueue('Subtask · Job 1042');render();}});
document.querySelector('#scenario').onchange = event => {
  state.scenario=event.target.value;
  // Different permission fixtures reset all in-memory work so restricted views never carry financial sample details.
  state.queue=[{title:'Photo · Job 1042',group:'Waiting',detail:'Waiting to upload · publication not confirmed'}];
  state.conflict=false;state.paymentPending=false;state.editor=null;state.lineDraft=null;state.page='jobs';state.filter='Daily';
  if(state.scenario==='conflict')handlers.seedConflict();render();
};
function switchVariant(delta) {
  const keys=Object.keys(variants);state.variant=keys[(keys.indexOf(state.variant)+delta+keys.length)%keys.length];
  if(state.page==='job')state.section=state.variant==='C'?'Index':state.variant==='A'?'Overview':'Work';
  const url=new URL(location.href);url.searchParams.set('variant',state.variant);history.replaceState(null,'',url);render();
}
document.querySelector('#previous').onclick=()=>switchVariant(-1);
document.querySelector('#next').onclick=()=>switchVariant(1);
document.querySelector('#reset').onclick=()=>location.reload();
document.querySelector('#review-cancel').onclick=()=>document.querySelector('#review').close();
document.addEventListener('keydown',event=>{
  if(document.querySelector('#review').open || event.target.closest('input,textarea,select,[contenteditable]'))return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();switchVariant(event.key==='ArrowRight'?1:-1);}
});
render();
