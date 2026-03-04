import type { VercelRequest, VercelResponse } from '@vercel/node';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type ChatRequestBody = {
  messages?: ChatMessage[];
  model?: string;
  conversationType?: string;
  providerPreference?: 'kimi' | 'deepseek';
  action?: 'chat' | 'status';
  max_tokens?: number;
};

type AIResponse = {
  provider: 'kimi' | 'deepseek';
  content: string;
  raw?: any;
};

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // per IP per window
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  rateLimiter.set(ip, entry);
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, resetAt: entry.resetAt };
}

async function callKimi(messages: ChatMessage[], model = 'moonshot-v1-8k', max_tokens = 512): Promise<AIResponse> {
  const apiKey = process.env.KIMI_API_KEY || '';
  if (!apiKey) throw new Error('KIMI_API_KEY not configured');

  const resp = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`KIMI error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  return { provider: 'kimi', content, raw: data };
}

async function checkKimi(): Promise<boolean> {
  const apiKey = process.env.KIMI_API_KEY || '';
  if (!apiKey) return false;
  try {
    const r = await fetch('https://api.moonshot.cn/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function callDeepSeek(messages: ChatMessage[], model = 'deepseek-chat', max_tokens = 512): Promise<AIResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY || '';
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`DeepSeek error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  return { provider: 'deepseek', content, raw: data };
}

async function checkDeepSeek(): Promise<boolean> {
  const apiKey = process.env.DEEPSEEK_API_KEY || '';
  if (!apiKey) return false;
  try {
    const r = await fetch('https://api.deepseek.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return r.ok;
  } catch {
    return false;
  }
}

function json(res: VercelResponse, status: number, body: any, headers: Record<string, string> = {}) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.status(status).send(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });
  if (req.method !== 'POST') return json(res, 405, { error: 'Method Not Allowed' });

  const ipHeader = (req.headers['x-forwarded-for'] || req.headers['client-ip'] || '') as string;
  const ip = ipHeader.split(',')[0].trim() || 'unknown';
  const rl = rateLimit(ip);
  if (!rl.allowed) return json(res, 429, { error: 'Rate limit exceeded', resetAt: rl.resetAt });

  let body: ChatRequestBody = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const action = body.action || 'chat';

  if (action === 'status') {
    const [kimi, deepseek] = await Promise.all([checkKimi(), checkDeepSeek()]);
    return json(res, 200, { kimi, deepseek });
  }

  const messages = body.messages || [{ role: 'user', content: '你好！' }];
  const model = body.model;
  const max_tokens = typeof body.max_tokens === 'number' ? body.max_tokens : 512;
  const preference = body.providerPreference || 'kimi';

  try {
    if (preference === 'kimi') {
      try {
        const r = await callKimi(messages, model || 'moonshot-v1-8k', max_tokens);
        return json(res, 200, r);
      } catch (e) {
        const r = await callDeepSeek(messages, model || 'deepseek-chat', max_tokens);
        return json(res, 200, r, { 'X-Fallback': 'deepseek' });
      }
    } else {
      try {
        const r = await callDeepSeek(messages, model || 'deepseek-chat', max_tokens);
        return json(res, 200, r);
      } catch (e) {
        const r = await callKimi(messages, model || 'moonshot-v1-8k', max_tokens);
        return json(res, 200, r, { 'X-Fallback': 'kimi' });
      }
    }
  } catch (error: any) {
    return json(res, 200, {
      provider: preference,
      content: '当前在线服务不可用，已返回模拟响应：请稍后重试。',
      raw: { error: error?.message || String(error) },
    }, { 'X-Mode': 'mock' });
  }
}