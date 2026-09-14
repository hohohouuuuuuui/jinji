import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateJson } from './_gemini.js';

interface QuoteSummary {
  quote: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { topic, myMessages } = req.body ?? {};
  if (typeof topic !== 'string' || !Array.isArray(myMessages)) {
    res.status(400).json({ error: 'topic and myMessages are required' });
    return;
  }

  const transcript = (myMessages as string[]).map((t, i) => `${i + 1}. ${t}`).join('\n');

  try {
    const result = await generateJson<QuoteSummary>(
      `너는 "진지한 대화" 앱의 참가기록 카드에 쓸 한 줄 어록을 뽑는 AI야.

주제: "${topic}"

한 참가자가 대화 중 실제로 한 발언들(순서대로):
${transcript || '(발언 없음)'}

이 발언들에서 이 사람의 핵심 주장이나 태도가 가장 잘 드러나는 한 문장을 골라줘.
- 실제로 한 말을 최대한 그대로 살리되, 문장이 너무 길면 핵심만 남기고 자연스럽게 다듬어도 돼.
- 새로운 내용을 지어내지 마.
- 발언이 없으면 참가 사실만 담아 "${topic}"에 참가했다" 같은 문장으로.

다음 JSON 형식으로만 답해: {"quote": "따옴표 없이 한국어 한 문장"}`,
      { thinkingLevel: 'low' },
    );
    res.status(200).json(result);
  } catch (err) {
    console.error('[api/summarize-quote]', err);
    const fallback = (myMessages as string[])[myMessages.length - 1];
    res.status(200).json({ quote: fallback ?? `"${topic}"에 참가했다` });
  }
}
