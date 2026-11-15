import { createTrialHandler } from '../server/trial-handler.mjs';

export const POST = createTrialHandler();

export function GET() {
  return Response.json({ error: 'Please use the class request form.' }, {
    status: 405,
    headers: { Allow: 'POST', 'Cache-Control': 'no-store' }
  });
}
