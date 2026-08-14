import { json, kakaoAuthHeader } from '../_shared.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = url.searchParams.get('origin'); // "lat,lng"
  const destination = url.searchParams.get('destination'); // "lat,lng"
  if (!origin || !destination) return json({ error: 'missing_params' }, 400);

  const [oLat, oLng] = origin.split(',').map(Number);
  const [dLat, dLng] = destination.split(',').map(Number);
  if ([oLat, oLng, dLat, dLng].some(n => Number.isNaN(n))) return json({ error: 'invalid_params' }, 400);

  const headers = kakaoAuthHeader(env);
  if (!headers) return json({ error: 'server_not_configured' }, 500);

  try {
    const apiUrl = `https://apis-navi.kakaomobility.com/v1/directions?origin=${oLng},${oLat}&destination=${dLng},${dLat}&priority=RECOMMEND`;
    const res = await fetch(apiUrl, { headers });
    if (!res.ok) return json({ error: 'upstream_failed' }, 502);

    const data = await res.json();
    const route = data.routes && data.routes[0];
    if (!route || route.result_code !== 0) return json({ error: 'no_route' }, 404);

    const s = route.summary;
    return json({ min: Math.round(s.duration / 60), km: Math.round(s.distance / 100) / 10 });
  } catch (e) {
    return json({ error: 'upstream_failed' }, 502);
  }
}
