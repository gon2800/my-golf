import { json } from '../_shared.js';

// 카카오맵 JavaScript SDK 키는 브라우저에 노출되는 것이 정상 사용 방식이다
// (Kakao Developers 콘솔에서 도메인으로 제한되는 공개용 키이며, REST 키와는 별개다).
export async function onRequestGet(context) {
  const { env } = context;
  return json({ kakaoJsKey: env.KAKAO_JS_KEY || null });
}
