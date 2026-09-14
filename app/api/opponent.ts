import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateJson } from './_gemini.js';

interface HistoryItem {
  seat: string;
  text: string;
}

interface OpponentReply {
  text: string;
}

const FALLBACK_REPLIES = [
  '흥미로운 지적입니다. 다만 그 근거를 조금 더 구체화해줄 수 있나요?',
  '그 관점도 일리는 있지만, 반대 사례는 어떻게 설명하실 건가요?',
  '말씀하신 부분에 동의하기 전에, 전제부터 다시 짚어보고 싶습니다.',
  '지금 논지의 핵심이 무엇인지 조금 더 구체적으로 말씀해주시겠어요?',
];

function randomFallback(): OpponentReply {
  return { text: FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)] };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { topic, history } = req.body ?? {};
  if (typeof topic !== 'string' || !topic.trim() || !Array.isArray(history)) {
    res.status(400).json({ error: 'topic and history are required' });
    return;
  }

  const transcript = (history as HistoryItem[])
    .filter((m) => m.seat === 'A' || m.seat === 'B')
    .map((m) => `${m.seat === 'A' ? '사용자' : 'AI'}: ${m.text}`)
    .join('\n');

  try {
    const reply = await generateJson<OpponentReply>(
      `너는 "진지한 대화" 앱에서 사용자와 1:1로 진지하게 논쟁하는 AI 논객이야.
주제: "${topic}"

지금까지의 대화:
${transcript || '(아직 대화 없음, 네가 먼저 논지를 제시해)'}

사용자의 마지막 발언에 대해 논리적으로 반박하거나 새로운 관점을 제시해. 존댓말을 쓰고, 인신공격이나 조롱 없이 논지에만 집중해. 2~4문장 이내로 간결하게.

다음 JSON 형식으로만 답해: {"text": "네 답변"}`,
      { thinkingLevel: 'low' },
    );
    res.status(200).json(reply);
  } catch (err) {
    console.error('[api/opponent]', err);
    res.status(200).json(randomFallback());
  }
}
