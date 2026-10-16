import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { InsuranceService } from './service.mjs';
import { HttpVision, OllamaVision } from './adapters.mjs';
import { ApiError, requireThat } from './domain.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const limit = 18 * 1024 * 1024;
async function jsonBody(request) {
  requireThat(request.headers['content-type']?.split(';')[0] === 'application/json', 'Use application/json', 415);
  const chunks = []; let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) { request.resume(); throw new ApiError(413, 'Request too large'); }
    chunks.push(chunk);
  }
  let value;
  try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new ApiError(400, 'Invalid JSON'); }
  requireThat(value && typeof value === 'object' && !Array.isArray(value), 'JSON object required', 400);
  return value;
}

export function createApp({ service = new InsuranceService(), token = process.env.API_AUTH_TOKEN } = {}) {
  return createServer(async (request, response) => {
    const send = (status, value) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      response.end(JSON.stringify(value));
    };
    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      if (request.method === 'GET' && path === '/') {
        response.writeHead(302, { Location: '/insurance/' }); return response.end();
      }
      if (request.method === 'GET' && ['/insurance/', '/insurance/index.html', '/insurance/ui.js', '/insurance/ui.css'].includes(path)) {
        const file = path.endsWith('.js') ? 'ui.js' : path.endsWith('.css') ? 'ui.css' : 'index.html';
        const body = await readFile(resolve(root, file));
        response.writeHead(200, { 'Content-Type': ({ 'ui.js': 'text/javascript', 'ui.css': 'text/css', 'index.html': 'text/html' })[file],
          'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store',
          'Content-Security-Policy': "default-src 'self'; img-src 'self' blob:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'" });
        return response.end(body);
      }
      if (path === '/api/health' && request.method === 'GET') return send(200, { status: 'ok', simulatedPayments: true });
      if (token && request.headers.authorization !== `Bearer ${token}`) throw new ApiError(401, 'API token required');
      if (path === '/api/company' && request.method === 'GET') return send(200, service.catalog());
      const match = path.match(/^\/api\/(quotes|policies|claims)(?:\/([^/]+))?(?:\/(issue|assess|settle))?$/);
      if (!match) throw new ApiError(404, 'Endpoint not found');
      const [, resource, recordId, action] = match;
      if (request.method === 'GET' && recordId && !action) {
        requireThat(resource !== 'quotes' || service.db.quotes.has(recordId), 'Quote not found', 404);
        return send(200, resource === 'claims' ? service.claim(recordId) : structuredClone(service.get(resource, recordId)));
      }
      if (request.method !== 'POST') throw new ApiError(405, 'Method not allowed');
      const input = await jsonBody(request), key = request.headers['idempotency-key'];
      if (resource === 'quotes' && !recordId) return send(201, await service.quote(input, key));
      if (resource === 'quotes' && recordId && action === 'issue') return send(201, await service.issue(recordId, key));
      if (resource === 'claims' && !recordId) return send(201, await service.createClaim(input, key));
      if (resource === 'claims' && recordId && action === 'assess') return send(200, await service.assess(recordId, key));
      if (resource === 'claims' && recordId && action === 'settle') return send(200, await service.settle(recordId, key));
      throw new ApiError(404, 'Endpoint not found');
    } catch (error) {
      send(error instanceof ApiError ? error.status : 500,
        { error: error instanceof ApiError ? error.message : 'Internal server error' });
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const vision = process.env.VISION_PROVIDER === 'ollama' ? new OllamaVision({ model: process.env.OLLAMA_MODEL })
    : process.env.VISION_URL ? new HttpVision({ url: process.env.VISION_URL, token: process.env.VISION_TOKEN }) : undefined;
  const app = createApp({ service: new InsuranceService({ vision }) });
  app.listen(Number(process.env.PORT ?? 4188), '127.0.0.1', () => {
    console.log(`Insurance Company demo: http://127.0.0.1:${app.address().port}/insurance/`);
  });
}
