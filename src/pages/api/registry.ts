import type { APIRoute } from 'astro';
import { trackerRegistry } from '@/lib/tracker-registry';

export const GET: APIRoute = async () => {
  return Response.json(trackerRegistry);
};
