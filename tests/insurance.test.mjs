import test from 'node:test';
import assert from 'node:assert/strict';
import { InsuranceService } from '../insurance/service.mjs';
import { HttpVision, OllamaVision } from '../insurance/adapters.mjs';
import { premium, validatePhotos } from '../insurance/domain.mjs';
import { createApp } from '../insurance/server.mjs';

const data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0xkAAAAASUVORK5CYII=';
const photo = { mimeType: 'image/png', data };
const input = { customerId: 'customer-1', vehicleId: 'vehicle-1', coverage: 'comprehensive', sumInsured: 60000000, deductible: 500000 };
function fixture(vision) {
  let now = new Date('2026-10-17T01:00:00Z');
  const service = new InsuranceService({ vision, clock: () => new Date(now) });
  return { service, advance: ms => { now = new Date(+now + ms); } };
}
async function policy(service, changes = {}) {
  const quote = await service.quote({ ...input, ...changes }, 'quote-key');
  return service.issue(quote.id, 'issue-key');
}
async function claim(service, p, changes = {}, key = 'claim-key') {
  return service.createClaim({ policyId: p.id, occurredAt: p.startsAt, cause: 'collision', photos: [photo], ...changes }, key);
}
const visionResult = (changes = {}) => ({ provider: 'test', model: 'fixture', simulated: true,
  confidence: 0.98, vehicleVisible: true, structuralDamage: false,
  damages: [{ part: 'bumper', severity: 'moderate' }], ...changes });

test('premium uses integer minor units and versioned rate breakdown', () => {
  assert.deepEqual(premium({ age: 4, value: 80000000 }, input),
    { currency: 'THB', net: 1296000, tax: 90720, total: 1386720, rateVersion: 'demo-1' });
  for (const changes of [{ sumInsured: -1 }, { sumInsured: 90000000 }, { deductible: -1 },
    { deductible: 1.5 }, { coverage: 'unknown' }]) assert.throws(() => premium({ age: 4, value: 80000000 }, { ...input, ...changes }));
});

test('quote/issue retries return one policy, immutable API snapshots', async () => {
  const { service } = fixture();
  const q = await service.quote(input, 'quote-key'); q.premium.total = 0;
  const [a, b] = await Promise.all([service.issue(q.id, 'issue-key'), service.issue(q.id, 'another-key')]);
  assert.equal(a.id, b.id); assert.equal(service.db.policies.size, 1); assert.equal(a.premium.total, 1386720);
  await assert.rejects(service.quote({ ...input, deductible: 0 }, 'quote-key'), /different input/);
  await assert.rejects(service.quote(input, 'short'), /Idempotency-Key/);
});

test('quote expires; customer must own vehicle', async () => {
  const { service, advance } = fixture();
  const q = await service.quote(input, 'quote-key'); advance(86400000);
  await assert.rejects(service.issue(q.id, 'issue-key'), /expired/);
  service.db.customers.set('other', { id: 'other' });
  await assert.rejects(service.quote({ ...input, customerId: 'other' }, 'other-quote'), /belong/);
});

test('upload validation rejects missing, duplicate, oversized and spoofed photos', () => {
  assert.equal(validatePhotos([photo])[0].hash.length, 64);
  for (const photos of [[], [photo, photo], [{ ...photo, mimeType: 'image/jpeg' }],
    [{ ...photo, data: 'bad!' }], [{ ...photo, data: 'A'.repeat(2800004) }]]) assert.throws(() => validatePhotos(photos));
});

test('incident must be covered and cannot reuse evidence or incident', async () => {
  const { service } = fixture(); const p = await policy(service);
  for (const occurredAt of ['invalid', '2026-10-16T00:00:00Z', '2026-10-18T00:00:00Z'])
    await assert.rejects(claim(service, p, { occurredAt }, `bad-time-${occurredAt.length}`), /coverage/);
  const c = await claim(service, p);
  assert.equal(c.photos[0].data, undefined);
  await assert.rejects(claim(service, p, {}, 'duplicate-claim'), /already/);
});

test('photo → estimate → payout → idempotent simulated settlement', async () => {
  const { service } = fixture(); const p = await policy(service), c = await claim(service, p);
  const assessed = await service.assess(c.id, 'assess-key');
  assert.equal(assessed.assessment.repair.total, 787500);
  assert.equal(assessed.assessment.payout, 287500);
  assert.equal(assessed.status, 'approved'); assert.equal(assessed.assessment.vision.simulated, true);
  const receipts = await Promise.all([service.settle(c.id, 'settle-key'), service.settle(c.id, 'other-settle')]);
  assert.equal(receipts[0].payment.id, receipts[1].payment.id);
  assert.equal(service.db.payments.size, 1); assert.equal(receipts[0].status, 'settled');
});

test('deductible floors payout at zero', async () => {
  const { service } = fixture(); const p = await policy(service, { deductible: 2000000 }), c = await claim(service, p);
  assert.equal((await service.assess(c.id, 'assess-key')).assessment.payout, 0);
});

for (const [name, changes, reason] of [
  ['low confidence', { confidence: 0.5 }, 'LOW_CONFIDENCE'],
  ['structural damage', { structuralDamage: true }, 'STRUCTURAL_DAMAGE'],
  ['no vehicle', { vehicleVisible: false }, 'INSUFFICIENT_EVIDENCE'],
  ['no visible damage', { damages: [] }, 'INSUFFICIENT_EVIDENCE'],
]) test(`${name} requires review and blocks settlement`, async () => {
  const { service } = fixture({ analyze: async () => visionResult(changes) });
  const p = await policy(service), c = await claim(service, p), a = await service.assess(c.id, 'assess-key');
  assert.equal(a.status, 'review_required'); assert.ok(a.assessment.reasons.includes(reason));
  await assert.rejects(service.settle(c.id, 'settle-key'), /not approved/);
});

test('collision-only policy flags other causes for coverage review', async () => {
  const { service } = fixture(); const p = await policy(service, { coverage: 'collision' });
  const c = await claim(service, p, { cause: 'other' });
  assert.ok((await service.assess(c.id, 'assess-key')).assessment.reasons.includes('COVERAGE_REVIEW'));
});

test('vision cannot invent parts, repeat parts, or pass invalid confidence', async () => {
  for (const changes of [{ confidence: 2 }, { damages: [{ part: '__proto__', severity: 'minor' }] },
    { damages: [{ part: 'bumper', severity: 'minor' }, { part: 'bumper', severity: 'minor' }] }]) {
    const { service } = fixture({ analyze: async () => visionResult(changes) });
    const p = await policy(service), c = await claim(service, p);
    await assert.rejects(service.assess(c.id, 'assess-key'), /vision|damage/);
    assert.equal(service.claim(c.id).status, 'submitted');
  }
});

test('failed vision call can retry with same key without losing claim', async () => {
  let calls = 0;
  const { service } = fixture({ analyze: async () => { if (!calls++) throw new Error('offline'); return visionResult(); } });
  const p = await policy(service), c = await claim(service, p);
  await assert.rejects(service.assess(c.id, 'assess-key'), /offline/);
  assert.equal((await service.assess(c.id, 'assess-key')).status, 'approved');
});

test('concurrent assessments reserve aggregate policy limit', async () => {
  const { service, advance } = fixture({ analyze: async () => visionResult({ damages: [{ part: 'headlamp', severity: 'severe' }] }) });
  const p = await policy(service, { sumInsured: 10000000, deductible: 0 });
  // Seed prior paid claim near the aggregate cap to exercise competing reservations.
  service.db.claims.set('prior', { id: 'prior', policyId: p.id, occurredAt: 'prior', photos: [],
    status: 'settled', assessment: { payout: 9500000 } });
  const a = await claim(service, p); advance(1000);
  const b = await claim(service, p, { occurredAt: '2026-10-17T01:00:01Z',
    photos: [{ ...photo, data: Buffer.concat([Buffer.from(data, 'base64'), Buffer.from('second')]).toString('base64') }] }, 'second-claim');
  const results = await Promise.all([service.assess(a.id, 'assess-a'), service.assess(b.id, 'assess-b')]);
  assert.equal(results.reduce((sum, c) => sum + c.assessment.payout, 0), 500000);
  assert.equal(results.filter(c => c.status === 'review_required').length, 1);
});

test('gateway receives actual photo bytes and excludes registration/customer data', async () => {
  let sent;
  const vision = new HttpVision({ url: 'https://vision.example.test/analyze', token: 'server-only',
    fetchImpl: async (url, options) => { sent = JSON.parse(options.body); return new Response(JSON.stringify(visionResult({ simulated: false }))); } });
  const result = await vision.analyze({ photos: [photo], vehicle: { make: 'Toyota', model: 'Corolla', registration: 'private' }, claimId: 'c1' });
  assert.equal(sent.photos[0].data, data); assert.equal(sent.vehicle.registration, undefined); assert.equal(result.simulated, false);
});

test('local vision uses image model with bounded structured output, no extra PII', async () => {
  let sent;
  const adapter = new OllamaVision({ model: 'installed-test-model', fetchImpl: async (url, options) => {
    sent = JSON.parse(options.body);
    return new Response(JSON.stringify({ done: true, message: { content: JSON.stringify(visionResult()) } }));
  } });
  const result = await adapter.analyze({ photos: [photo] });
  assert.equal(sent.messages[1].images[0], data); assert.equal(sent.format.type, 'object');
  assert.equal(sent.options.num_predict, 512); assert.equal(result.simulated, false); assert.equal(result.provider, 'ollama');
  assert.throws(() => new OllamaVision({ model: 'test', url: 'http://external.test/api/chat' }), /local/);
});

test('vision transport errors, incomplete results and oversized responses fail closed', async () => {
  for (const response of [new Response('{}', { status: 503 }), new Response('x'.repeat(17000)), new Response('{}')]) {
    const adapter = new OllamaVision({ model: 'test', fetchImpl: async () => response });
    await assert.rejects(adapter.analyze({ photos: [photo] }), /unavailable/);
  }
});

test('HTTP contract: auth, JSON errors, idempotency, complete flow and static UI', async t => {
  const { service } = fixture(); const app = createApp({ service, token: 'test-token' });
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => app.close(resolve)));
  const base = `http://127.0.0.1:${app.address().port}`;
  const call = async (path, body, key = 'http-test-key') => fetch(`${base}/api/${path}`, {
    method: body === undefined ? 'GET' : 'POST', headers: { Authorization: 'Bearer test-token',
      'Content-Type': 'application/json', 'Idempotency-Key': key }, body: body === undefined ? undefined : JSON.stringify(body) });
  assert.equal((await fetch(`${base}/api/company`)).status, 401);
  assert.equal((await fetch(`${base}/insurance/`)).status, 200);
  assert.equal((await call('company')).status, 200);
  assert.equal((await call('quotes', null)).status, 400);
  const qResponse = await call('quotes', input); assert.equal(qResponse.status, 201); const q = await qResponse.json();
  const p = await (await call(`quotes/${q.id}/issue`, {})).json();
  const c = await (await call('claims', { policyId: p.id, occurredAt: p.startsAt, cause: 'collision', photos: [photo] })).json();
  assert.equal((await (await call(`claims/${c.id}/assess`, {})).json()).status, 'approved');
  assert.equal((await (await call(`claims/${c.id}/settle`, {})).json()).payment.simulated, true);
  const output = await (await call(`claims/${c.id}`)).json(); assert.equal(output.photos[0].data, undefined);
  assert.equal((await call('claims/missing')).status, 404);
});
