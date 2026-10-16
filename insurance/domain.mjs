import { createHash, randomUUID } from 'node:crypto';

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function requireThat(condition, message, status = 422) {
  if (!condition) throw new ApiError(status, message);
}
export const hash = value => createHash('sha256').update(value).digest('hex');
export const id = prefix => `${prefix}_${randomUUID()}`;
export const copy = value => structuredClone(value);

// All monetary values are integer satang (THB minor units). Illustrative rates only.
export const RATES = Object.freeze({ version: 'demo-1', comprehensiveBps: 240, collisionBps: 160,
  taxBps: 700, minimumPremium: 300000, confidenceFloor: 0.85, autoSettlementLimit: 5000000 });
export const PARTS = Object.freeze({ bumper: 900000, door: 1400000, hood: 1600000,
  fender: 1000000, headlamp: 1200000, windshield: 1000000 });
export const SEVERITY = Object.freeze({ minor: 0.35, moderate: 0.7, severe: 1 });
const own = (object, key) => Object.hasOwn(object, key);

export function premium(vehicle, input) {
  requireThat(['comprehensive', 'collision'].includes(input.coverage), 'Unsupported coverage');
  requireThat(Number.isSafeInteger(input.sumInsured) && input.sumInsured >= 1000000 &&
    input.sumInsured <= vehicle.value, 'Invalid sumInsured');
  requireThat(Number.isSafeInteger(input.deductible) && input.deductible >= 0 &&
    input.deductible <= Math.min(input.sumInsured, 2000000), 'Invalid deductible');
  const baseBps = input.coverage === 'comprehensive' ? RATES.comprehensiveBps : RATES.collisionBps;
  const ageBps = vehicle.age > 7 ? 12500 : 10000;
  const deductibleBps = input.deductible >= 500000 ? 9000 : 10000;
  const net = Math.max(RATES.minimumPremium,
    Math.round(input.sumInsured * baseBps / 10000 * ageBps / 10000 * deductibleBps / 10000));
  const tax = Math.round(net * RATES.taxBps / 10000);
  return { currency: 'THB', net, tax, total: net + tax, rateVersion: RATES.version };
}

export function validatePhotos(photos) {
  requireThat(Array.isArray(photos) && photos.length >= 1 && photos.length <= 6, 'Upload 1–6 photos');
  const seen = new Set();
  return photos.map(photo => {
    requireThat(photo && ['image/jpeg', 'image/png', 'image/webp'].includes(photo.mimeType), 'Use JPEG, PNG or WebP');
    requireThat(typeof photo.data === 'string' && photo.data.length <= 2800000 &&
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(photo.data), 'Invalid base64 photo');
    const bytes = Buffer.from(photo.data, 'base64');
    requireThat(bytes.length >= 12 && bytes.length <= 2 * 1024 * 1024, 'Photo must be at most 2 MiB');
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    requireThat(({ 'image/jpeg': jpeg, 'image/png': png, 'image/webp': webp })[photo.mimeType], 'Photo signature mismatch');
    const digest = hash(bytes);
    requireThat(!seen.has(digest), 'Duplicate photo'); seen.add(digest);
    return { mimeType: photo.mimeType, data: photo.data, hash: digest };
  });
}

// Treat vision output as untrusted. Prices and payout decisions come from our rules.
export function estimate(analysis) {
  requireThat(analysis && typeof analysis.provider === 'string' && typeof analysis.model === 'string' &&
    typeof analysis.simulated === 'boolean', 'Invalid vision provenance', 502);
  requireThat(Number.isFinite(analysis.confidence) && analysis.confidence >= 0 && analysis.confidence <= 1 &&
    typeof analysis.structuralDamage === 'boolean' && typeof analysis.vehicleVisible === 'boolean' &&
    Array.isArray(analysis.damages) && analysis.damages.length <= 20, 'Invalid vision response', 502);
  const parts = new Set();
  const items = analysis.damages.map(damage => {
    requireThat(damage && own(PARTS, damage.part) && own(SEVERITY, damage.severity) &&
      !parts.has(damage.part), 'Unknown or duplicate damage part', 502);
    parts.add(damage.part);
    const partsCost = Math.round(PARTS[damage.part] * SEVERITY[damage.severity]);
    const labor = Math.round(partsCost * 0.25);
    return { part: damage.part, severity: damage.severity, partsCost, labor, total: partsCost + labor };
  });
  return { currency: 'THB', items, total: items.reduce((sum, item) => sum + item.total, 0), priceVersion: 'demo-1' };
}

export function assessment(policy, claim, analysis, available) {
  const repair = estimate(analysis);
  const reasons = [];
  if (!analysis.vehicleVisible || !repair.items.length) reasons.push('INSUFFICIENT_EVIDENCE');
  if (analysis.confidence < RATES.confidenceFloor) reasons.push('LOW_CONFIDENCE');
  if (analysis.structuralDamage) reasons.push('STRUCTURAL_DAMAGE');
  if (repair.total >= policy.sumInsured * 0.75) reasons.push('POSSIBLE_TOTAL_LOSS');
  if (policy.coverage === 'collision' && claim.cause !== 'collision') reasons.push('COVERAGE_REVIEW');
  const payout = Math.max(0, Math.min(repair.total - policy.deductible, available));
  if (payout > RATES.autoSettlementLimit) reasons.push('ABOVE_AUTOMATION_LIMIT');
  if (available <= 0) reasons.push('POLICY_LIMIT_EXHAUSTED');
  return { repair, payout, availableBefore: available, deductible: policy.deductible,
    status: reasons.length ? 'review_required' : 'approved', reasons,
    vision: { provider: analysis.provider, model: analysis.model, confidence: analysis.confidence,
      simulated: analysis.simulated, structuralDamage: analysis.structuralDamage }, ruleVersion: RATES.version };
}
