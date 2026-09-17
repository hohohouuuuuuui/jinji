import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateJson } from './_gemini.js';

interface Briefing {
  terms: string[];
  issues: string[];
  objections: string[];
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
    const briefing = await generateJson<Briefing>(
      `너는 토론 진행 보조 AI야. 아래 토론 주제에 대한 사전 브리핑을 만들어줘.
주제: "${topic}"

다음 JSON 형식으로만, 다른 설명 없이 한국어로 답해:
{
  "terms": ["핵심 용어 정확히 5개"],
  "issues": ["구체적인 쟁점 문장 정확히 3개, 각각 물음표로 끝나는 질문 형태"],
  "objections": ["서로 다른 입장에서의 대표적인 반대 의견 정확히 2개, 각각 인용문처럼 한 문장"]
}`,
      { thinkingLevel: 'low' },
    );
    res.status(200).json(briefing);
  } catch (err) {
    console.error('[api/briefing]', err);
    res.status(502).json({ error: 'briefing generation failed' });
  }
}
