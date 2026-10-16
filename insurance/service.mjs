import { ApiError, requireThat, id, hash, copy, premium, validatePhotos, assessment } from './domain.mjs';
import { mockCompanyDatabase, MockVision, MockPayments, OllamaVision } from './adapters.mjs';

export class InsuranceService {
  constructor({ db = mockCompanyDatabase(), vision = new MockVision(), payments,
    clock = () => new Date() } = {}) {
    this.db = db; this.vision = vision; this.payments = payments ?? new MockPayments(db); this.clock = clock;
    this.locks = new Map();
  }
  // In-process serialization. SQL adapter must use row locks/unique constraints instead.
  async locked(key, action) {
    const previous = this.locks.get(key) ?? Promise.resolve();
    const current = previous.catch(() => {}).then(action);
    this.locks.set(key, current);
    try { return await current; } finally { if (this.locks.get(key) === current) this.locks.delete(key); }
  }
  async once(scope, key, input, action) {
    requireThat(typeof key === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(key), 'Idempotency-Key required (8–128 letters, digits, _ or -)', 400);
    const index = `${scope}:${key}`, fingerprint = hash(JSON.stringify(input));
    const existing = this.db.idempotency.get(index);
    if (existing) {
      requireThat(existing.fingerprint === fingerprint, 'Idempotency key reused with different input', 409);
      return copy(await existing.result);
    }
    const result = Promise.resolve().then(action);
    this.db.idempotency.set(index, { fingerprint, result });
    try { return copy(await result); } catch (error) { this.db.idempotency.delete(index); throw error; }
  }
  get(collection, key) {
    requireThat(typeof key === 'string', 'ID required');
    const value = this.db[collection].get(key);
    if (!value) throw new ApiError(404, `${collection} record not found`);
    return value;
  }
  catalog() {
    return copy({ company: this.db.company, customers: [...this.db.customers.values()],
      vehicles: [...this.db.vehicles.values()], currency: 'THB', moneyUnit: 'satang',
      coverages: ['comprehensive', 'collision'], storage: 'volatile-memory', paymentMode: 'simulated',
      visionMode: this.vision instanceof MockVision ? 'simulated' : this.vision instanceof OllamaVision ? 'ollama' : 'gateway' });
  }
  quote(input, key) {
    return this.once('quote', key, input, () => {
      const customer = this.get('customers', input.customerId), vehicle = this.get('vehicles', input.vehicleId);
      requireThat(vehicle.customerId === customer.id, 'Vehicle does not belong to customer');
      const price = premium(vehicle, input), now = this.clock();
      const quote = { id: id('quote'), customerId: customer.id, vehicleId: vehicle.id,
        companyName: this.db.company.name, coverage: input.coverage, sumInsured: input.sumInsured,
        deductible: input.deductible, premium: price, status: 'quoted', simulated: true,
        createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 86400000).toISOString() };
      this.db.quotes.set(quote.id, quote); return quote;
    });
  }
  issue(quoteId, key) {
    return this.once('issue', key, { quoteId }, () => this.locked(`quote:${quoteId}`, () => {
      const quote = this.get('quotes', quoteId), now = this.clock();
      if (quote.policyId) return this.get('policies', quote.policyId);
      requireThat(now < new Date(quote.expiresAt), 'Quote expired', 409);
      const policy = { id: id('policy'), quoteId, customerId: quote.customerId, vehicleId: quote.vehicleId,
        companyName: quote.companyName, coverage: quote.coverage, sumInsured: quote.sumInsured,
        deductible: quote.deductible, premium: quote.premium, status: 'active', simulated: true,
        startsAt: now.toISOString(), endsAt: new Date(now.getTime() + 365 * 86400000).toISOString() };
      this.db.policies.set(policy.id, policy); quote.policyId = policy.id; quote.status = 'issued';
      return policy;
    }));
  }
  createClaim(input, key) {
    // Validate and hash uploads before storing; raw images never enter public responses.
    return this.once('claim', key, input, () => {
      const policy = this.get('policies', input.policyId), occurred = new Date(input.occurredAt);
      requireThat(typeof input.occurredAt === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(input.occurredAt) &&
        Number.isFinite(occurred.getTime()) &&
        occurred >= new Date(policy.startsAt) && occurred < new Date(policy.endsAt) &&
        occurred <= this.clock(), 'Incident must be within policy coverage and not in the future');
      requireThat(policy.status === 'active' && ['collision', 'other'].includes(input.cause), 'Invalid policy or cause');
      const photos = validatePhotos(input.photos);
      for (const other of this.db.claims.values()) {
        requireThat(other.policyId !== policy.id || !other.photos.some(a => photos.some(b => a.hash === b.hash)),
          'Photo already used on this policy', 409);
        requireThat(other.policyId !== policy.id || other.occurredAt !== occurred.toISOString(),
          'Incident already reported', 409);
      }
      const claim = { id: id('claim'), policyId: policy.id, cause: input.cause,
        occurredAt: occurred.toISOString(), createdAt: this.clock().toISOString(), photos, status: 'submitted' };
      this.db.claims.set(claim.id, claim); return this.publicClaim(claim);
    });
  }
  publicClaim(claim) {
    const { photos, ...result } = claim;
    return copy({ ...result, photos: photos.map(({ hash, mimeType }) => ({ hash, mimeType })) });
  }
  claim(claimId) { return this.publicClaim(this.get('claims', claimId)); }
  assess(claimId, key) {
    return this.once('assess', key, { claimId }, () => this.locked(`claim:${claimId}`, async () => {
      const claim = this.get('claims', claimId), policy = this.get('policies', claim.policyId);
      if (claim.assessment) return this.publicClaim(claim);
      const analysis = await this.vision.analyze({ photos: claim.photos,
        vehicle: this.get('vehicles', policy.vehicleId), claimId });
      return this.locked(`policy:${policy.id}`, () => {
        const reserved = [...this.db.claims.values()].filter(c => c.policyId === policy.id &&
          ['approved', 'settled'].includes(c.status)).reduce((sum, c) => sum + c.assessment.payout, 0);
        claim.assessment = assessment(policy, claim, analysis, Math.max(0, policy.sumInsured - reserved));
        claim.status = claim.assessment.status; claim.assessedAt = this.clock().toISOString();
        return this.publicClaim(claim);
      });
    }));
  }
  settle(claimId, key) {
    return this.once('settle', key, { claimId }, () => this.locked(`claim:${claimId}`, async () => {
      const claim = this.get('claims', claimId);
      if (claim.status === 'settled') return this.publicClaim(claim);
      requireThat(claim.status === 'approved', 'Claim is not approved for automatic settlement', 409);
      const payment = await this.payments.pay({ claimId, amount: claim.assessment.payout, currency: 'THB' });
      requireThat(payment && payment.simulated === true && payment.status === 'simulated_paid' &&
        payment.amount === claim.assessment.payout, 'Payment adapter returned invalid receipt', 502);
      claim.payment = payment; claim.status = 'settled'; claim.settledAt = this.clock().toISOString();
      return this.publicClaim(claim);
    }));
  }
}
