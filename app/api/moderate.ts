import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateJson } from './_gemini.js';

type ModerationAxis = 'profanity' | 'disrespect' | 'personal_attack' | 'mockery' | 'none';

interface ModerationResult {
  flagged: boolean;
  axis: ModerationAxis;
  reason: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { text } = req.body ?? {};
  if (typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  try {
    const result = await generateJson<ModerationResult>(
      `너는 진지한 토론 앱의 AI 모더레이터야. 아래 발언을 4개 축 중 하나로 분류해:
- profanity: 명시적 욕설
- disrespect: 존대 이탈 ("야", "그거 아니라니까" 같은 반말/하대)
- personal_attack: 주장이 아니라 사람 자체를 공격 ("네가 멍청하다" 등, "네 논리가 틀렸다"는 해당 없음)
- mockery: 조롱·비꼼 ("ㅋㅋ 그걸 왜 진지하게", "오글거린다", "진지충" 등 진지함 자체를 처벌하는 발화)
- none: 문제 없음

발언: "${text.replace(/"/g, '\\"')}"

다음 JSON 형식으로만 답해: {"flagged": boolean, "axis": "profanity"|"disrespect"|"personal_attack"|"mockery"|"none", "reason": "한국어 한 줄 이유"}`,
      { thinkingLevel: 'low' },
    );
    res.status(200).json(result);
  } catch (err) {
    console.error('[api/moderate]', err);
    // Fail open: if moderation itself errors, don't block the conversation.
    res.status(200).json({ flagged: false, axis: 'none', reason: 'moderation unavailable' });
  }
}
