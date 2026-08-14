import { json, BUNDANG, kakaoAuthHeader } from '../_shared.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ error: 'missing_query' }, 400);

  const headers = kakaoAuthHeader(env);
  if (!headers) return json({ error: 'server_not_configured' }, 500);

  try {
    let doc = await tryAddressSearch(q, headers);
    if (!doc) doc = await tryKeywordSearch(q, headers);
    if (!doc) return json({ error: 'not_found' }, 404);

    const lat = parseFloat(doc.y ?? doc.address?.y);
    const lng = parseFloat(doc.x ?? doc.address?.x);
    const address = doc.address_name || doc.road_address_name || q;
    if (Number.isNaN(lat) || Number.isNaN(lng)) return json({ error: 'not_found' }, 404);

    return json({ lat, lng, address });
  } catch (e) {
    return json({ error: 'upstream_failed' }, 502);
  }
}

async function tryAddressSearch(q, headers) {
  const res = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(q)}`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  return data.documents && data.documents[0];
}

async function tryKeywordSearch(q, headers) {
  // 분당 기준 반경 우선 정렬 (사업장명/장소명 검색 폴백)
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&x=${BUNDANG.lng}&y=${BUNDANG.lat}&radius=50000`,
    { headers }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.documents && data.documents[0];
}
