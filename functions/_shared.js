export const BUNDANG = { lat: 37.3825, lng: 127.1191 };

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

export function kakaoAuthHeader(env) {
  const key = env.KAKAO_REST_KEY;
  if (!key) return null;
  return { Authorization: `KakaoAK ${key}` };
}
