import { createBookingHandler } from '../server/booking-handler.mjs';

export const POST = createBookingHandler();
export function GET() {
  return Response.json({error:'Please use the seminar or private training form.'},{status:405,headers:{Allow:'POST','Cache-Control':'no-store'}});
}
