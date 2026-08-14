import { json, BUNDANG, kakaoAuthHeader } from '../_shared.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ error: 'missing_query' }, 400);

  const headers = kakaoAuthHeader(env);
  if (!headers) return json({ error: 'server_not_configured' }, 500);

  try {
    let r = await tryAddressSearch(q, headers);
    // 주소 검색이 정상 응답(200)인데 결과만 없는 경우에만 키워드 검색으로 폴백한다.
    // 인증/요청 오류(비2xx)는 두 번째 호출도 똑같이 실패하므로 그대로 오류를 보고한다.
    if (!r.doc && r.status === 200) r = await tryKeywordSearch(q, headers);

    if (r.status === 401 || r.status === 403) {
      return json({ error: 'kakao_unauthorized', upstreamStatus: r.status }, 502);
    }
    if (r.status !== 200) {
      return json({ error: 'kakao_upstream_error', upstreamStatus: r.status }, 502);
    }
    if (!r.doc) return json({ error: 'not_found' }, 404);

    const lat = parseFloat(r.doc.y ?? r.doc.address?.y);
    const lng = parseFloat(r.doc.x ?? r.doc.address?.x);
    const address = r.doc.address_name || r.doc.road_address_name || q;
    if (Number.isNaN(lat) || Number.isNaN(lng)) return json({ error: 'not_found' }, 404);

    return json({ lat, lng, address });
  } catch (e) {
    return json({ error: 'upstream_failed' }, 502);
  }
}

async function tryAddressSearch(q, headers) {
  const res = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(q)}`, { headers });
  const status = res.status;
  if (!res.ok) return { doc: null, status };
  const data = await res.json();
  return { doc: data.documents && data.documents[0], status };
}

async function tryKeywordSearch(q, headers) {
  // 분당 기준 반경 우선 정렬 (사업장명/장소명 검색 폴백)
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&x=${BUNDANG.lng}&y=${BUNDANG.lat}&radius=50000`,
    { headers }
  );
  const status = res.status;
  if (!res.ok) return { doc: null, status };
  const data = await res.json();
  return { doc: data.documents && data.documents[0], status };
}
