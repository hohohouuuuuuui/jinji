import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateJson } from './_gemini.js';

interface ValidationResult {
  valid: boolean;
  message: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { topic } = req.body ?? {};
  if (typeof topic !== 'string' || !topic.trim()) {
    res.status(400).json({ error: 'topic is required' });
    return;
  }

  try {
    const result = await generateJson<ValidationResult>(
      `사용자가 AI와 1:1로 토론·대결 연습을 하려고 아래 주제를 입력했어:
"${topic}"

이 주제로 찬반이 갈리거나 서로 다른 입장이 대립하는 토론/논쟁이 가능한지 판단해.
- "결혼", "연애", "행복"처럼 특정 주장이나 질문 없이 단어만 있는 경우는 부적합해.
- "결혼은 해야 하는가", "선의의 거짓말은 정당한가"처럼 찬반이 명확히 갈리는 질문/주장 형태면 적합해.
- 너무 사소하거나(예: "오늘 점심 뭐 먹지") 답이 사실상 하나로 정해진 질문(예: "지구는 둥근가")도 부적합해.

다음 JSON 형식으로만 답해:
{"valid": boolean, "message": "부적합할 때만: 왜 부적합한지와 어떻게 구체화하면 좋을지 한국어로 1~2문장. 적합하면 빈 문자열"}`,
      { thinkingLevel: 'low' },
    );
    res.status(200).json(result);
  } catch (err) {
    console.error('[api/validate-topic]', err);
    // Fail open: if validation itself errors, let the user proceed rather than block them.
    res.status(200).json({ valid: true, message: '' });
  }
}
