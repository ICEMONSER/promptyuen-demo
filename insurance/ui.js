const $ = id => document.getElementById(id);
const money = amount => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount / 100);
let catalog, quote, claim, previewUrls = [];
// Keep the same key across retries of an identical operation; never persist credentials/photos.
const pending = new Map();
async function api(path, body) {
  const payload = body ? JSON.stringify(body) : undefined;
  const digest = payload ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))),
    byte => byte.toString(16).padStart(2, '0')).join('') : '';
  const operation = `${path}:${digest}`;
  if (body && !pending.has(operation)) pending.set(operation, crypto.randomUUID());
  const response = await fetch(`/api/${path}`, { method: body ? 'POST' : 'GET',
    headers: { ...(body ? { 'Content-Type': 'application/json', 'Idempotency-Key': pending.get(operation) } : {}),
      ...($('token').value ? { Authorization: `Bearer ${$('token').value}` } : {}) },
    ...(body ? { body: payload } : {}) });
  let result;
  try { result = await response.json(); } catch { throw new Error('Start the Node API server and open /insurance/ there. GitHub Pages cannot run the API.'); }
  if (!response.ok) throw new Error(result.error || 'Request failed');
  return result;
}
async function perform(button, action) {
  button.disabled = true; $('message').textContent = '';
  try { await action(); } catch (error) { $('message').textContent = error.message; }
  finally { button.disabled = false; }
}
function options(select, records, label) {
  select.replaceChildren(...records.map(record => new Option(label(record), record.id)));
}
function vehicles() {
  options($('vehicle'), catalog.vehicles.filter(v => v.customerId === $('customer').value), v => `${v.make} ${v.model} · ${v.registration}`);
}
async function connect() {
  catalog = await api('company');
  $('company-name').textContent = catalog.company.name;
  $('vision-mode').textContent = catalog.visionMode === 'simulated' ? 'Fixed mock scenario' : catalog.visionMode === 'ollama' ? 'Local vision model' : 'Vision gateway';
  $('connection-status').textContent = catalog.visionMode === 'simulated'
    ? 'Connected · Photos are not analyzed in mock mode.' : catalog.visionMode === 'ollama'
      ? 'Connected · Photos will be analyzed by your local Ollama model.' : 'Connected · Photos will be sent to the configured vision gateway.';
  options($('customer'), catalog.customers, c => c.name); vehicles();
}
$('connect').onclick = () => perform($('connect'), connect);
$('customer').onchange = vehicles;
$('quote-form').onsubmit = event => {
  event.preventDefault();
  perform(event.submitter, async () => {
    quote = await api('quotes', { customerId: $('customer').value, vehicleId: $('vehicle').value,
      coverage: $('coverage').value, sumInsured: Math.round(Number($('sum-insured').value) * 100),
      deductible: Math.round(Number($('deductible').value) * 100) });
    const result = $('quote-result'); result.replaceChildren();
    const total = document.createElement('strong'); total.textContent = `${money(quote.premium.total)} / year`;
    const detail = document.createElement('p'); detail.textContent = `Net ${money(quote.premium.net)} + demo tax ${money(quote.premium.tax)}. Quote valid 24 hours.`;
    result.append(total, detail); $('issue').disabled = false;
  });
};
$('issue').onclick = () => perform($('issue'), async () => {
  const policy = await api(`quotes/${quote.id}/issue`, {});
  $('policy-id').value = policy.id; $('policy-result').textContent = `Active demo policy: ${policy.id}`;
  const local = new Date(Date.now() - new Date().getTimezoneOffset() * 60000 + 1000);
  $('occurred-at').value = local.toISOString().slice(0, 19);
});
$('photos').onchange = () => {
  previewUrls.forEach(URL.revokeObjectURL); previewUrls = [];
  $('previews').replaceChildren();
  for (const file of [...$('photos').files].slice(0, 6)) {
    const img = document.createElement('img'); img.alt = 'Selected accident photo';
    img.src = URL.createObjectURL(file); previewUrls.push(img.src); $('previews').append(img);
  }
};
const encode = file => new Promise((resolve, reject) => {
  const reader = new FileReader(); reader.onerror = () => reject(new Error('Unable to read photo'));
  reader.onload = () => resolve({ mimeType: file.type, data: reader.result.split(',')[1] }); reader.readAsDataURL(file);
});
function renderClaim() {
  const result = $('claim-result'); result.replaceChildren();
  const status = document.createElement('span'); status.className = 'tag'; status.textContent = claim.status.replaceAll('_', ' '); result.append(status);
  if (claim.assessment) {
    const a = claim.assessment, total = document.createElement('strong'), details = document.createElement('p');
    total.textContent = ` ${money(a.payout)} payout estimate`;
    details.textContent = `Repair ${money(a.repair.total)} · deductible ${money(a.deductible)} · confidence ${Math.round(a.vision.confidence * 100)}%. ${a.vision.simulated ? 'Fixed simulated result, unrelated to photo content.' : `Model: ${a.vision.model}.`} ${a.reasons.join(', ')}`;
    result.append(total, details);
    for (const item of a.repair.items) {
      const row = document.createElement('p'); row.textContent = `${item.part} · ${item.severity} · ${money(item.total)}`; result.append(row);
    }
  }
  if (claim.payment) { const receipt = document.createElement('p'); receipt.textContent = `Simulated settlement complete · ${claim.payment.id}`; result.append(receipt); }
  $('settle').disabled = claim.status !== 'approved'; $('retry-assess').disabled = !!claim.assessment;
}
async function assess() { claim = await api(`claims/${claim.id}/assess`, {}); renderClaim(); }
$('claim-form').onsubmit = event => {
  event.preventDefault();
  perform(event.submitter, async () => {
    const files = [...$('photos').files];
    if (!files.length || files.length > 6 || files.some(f => f.size > 2 * 1024 * 1024)) throw new Error('Choose 1–6 photos, at most 2 MiB each.');
    $('settle').disabled = true; $('retry-assess').disabled = true;
    claim = await api('claims', { policyId: $('policy-id').value, cause: $('cause').value,
      occurredAt: new Date($('occurred-at').value).toISOString(), photos: await Promise.all(files.map(encode)) });
    renderClaim(); await assess();
  });
};
$('retry-assess').onclick = () => perform($('retry-assess'), assess).then(renderClaim);
$('settle').onclick = () => perform($('settle'), async () => { claim = await api(`claims/${claim.id}/settle`, {}); renderClaim(); }).then(renderClaim);
connect().catch(error => { $('connection-status').textContent = error.message; });
