import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateJson } from './_gemini.js';

interface StillmanVerdict {
  good: boolean;
  feedback: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { topic, opponentText, summary } = req.body ?? {};
  if (
    typeof topic !== 'string' ||
    typeof opponentText !== 'string' ||
    typeof summary !== 'string' ||
    !summary.trim()
  ) {
    res.status(400).json({ error: 'topic, opponentText, and summary are required' });
    return;
  }

  try {
    const verdict = await generateJson<StillmanVerdict>(
      `너는 "진지한 대화" 앱에서 스틸맨(stillman) 판정을 하는 AI야. 스틸맨이란 상대방의 주장을
왜곡하거나 약화시키지 않고, 상대 본인보다도 명확하게 요약하는 것을 말해.

주제: "${topic}"

상대방이 실제로 한 발언들:
${opponentText || '(발언 없음)'}

사용자가 상대 입장을 다음과 같이 요약했어:
"${summary}"

이 요약이 상대 입장을 정확하고 공정하게 담고 있는지 판단해. 핵심을 놓쳤거나, 왜곡했거나,
너무 짧아 성의가 없거나, 오히려 상대를 조롱/비하하는 톤이면 부적합해.

다음 JSON 형식으로만 답해: {"good": boolean, "feedback": "한국어 한 줄 피드백"}`,
      { thinkingLevel: 'low' },
    );
    res.status(200).json(verdict);
  } catch (err) {
    console.error('[api/stillman]', err);
    res.status(200).json({ good: false, feedback: '판정 중 오류가 발생했어요. 다시 시도해주세요.' });
  }
}
