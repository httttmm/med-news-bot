import Anthropic from '@anthropic-ai/sdk';
import type { Language, TranslatedContent } from '../types/index.js';

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT_EN_TO_JA = `You translate medical and scientific news from English to natural Japanese for a medical-focused Bluesky bot aimed at Japanese healthcare professionals, researchers, and patients.

Output format: Respond ONLY with a single JSON object, no markdown, no extra prose:
{"title": "...", "description": "..."}

Translation requirements:
- Produce natural, idiomatic Japanese for medical headlines
- Preserve medical identifiers exactly: drug names (generic and brand), dosages, trial phases, clinical endpoints, statistical values (p-values, confidence intervals, hazard ratios, NNT)
- Keep established medical terms in their standard Japanese form (e.g., "がん" for cancer, "ランダム化比較試験" for RCT, "メタ解析" for meta-analysis)
- Keep acronyms widely used in Japanese medical contexts in English (e.g., RCT, FDA, EMA, PMDA, ICU, COVID)
- Drug names: use generic name in katakana where established; preserve brand names as-is
- Date / version / phase numbers: keep numeric form

Title:
- Concise, under 70 Japanese characters, headline style
- Mention the key finding or action (approved, found, associated with, reduced, etc.)
- No filler ("について" / "という話")

Description (BODY of the post — readers see it directly):
- 2-3 sentences, 100-170 Japanese characters
- State specifically: what was found/approved/studied, who is affected, clinical significance or magnitude of effect if available
- Mention study design or source journal when relevant
- Avoid fluff like "この記事では〜について解説します"`;

const SYSTEM_PROMPT_JA_SUMMARIZE = `You summarize Japanese medical news for a Bluesky bot. Input is already in Japanese.

Output format: Respond ONLY with a single JSON object, no markdown:
{"title": "...", "description": "..."}

Rules:
- Title: return the input title as-is, but truncate to under 70 Japanese characters if longer
- Description: 2-3 sentences, 100-170 Japanese characters, summarizing the article body. Be specific (what was found/approved, who is affected, clinical significance). Avoid filler like "本記事では〜"
- Preserve drug names, dosages, clinical values, statistical figures, and organization names exactly
- If the description input is empty or just metadata, return an empty string for description`;

export interface TranslatorOptions {
  apiKey: string;
  model?: string;
  client?: Pick<Anthropic, 'messages'>;
  timeoutMs?: number;
}

export interface Translator {
  /**
   * 言語に応じて翻訳または要約する。
   * - 入力が英語 (en) なら日本語に翻訳 + 要約
   * - 入力が日本語 (ja) なら日本語のまま要約
   * - 失敗時は例外 throw
   */
  translate(input: {
    title: string;
    description: string;
    language: Language;
  }): Promise<TranslatedContent>;
}

export function createTranslator(options: TranslatorOptions): Translator {
  const model = options.model?.trim() || DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const client: Pick<Anthropic, 'messages'> =
    options.client ??
    new Anthropic({
      apiKey: options.apiKey,
      timeout: timeoutMs,
      maxRetries: 8,
    });

  return {
    async translate({ title, description, language }) {
      const systemPrompt =
        language === 'ja' ? SYSTEM_PROMPT_JA_SUMMARIZE : SYSTEM_PROMPT_EN_TO_JA;
      const userText = [
        `Title: ${title}`,
        '',
        `Description: ${description.trim() || '(no description available)'}`,
      ].join('\n');

      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userText }],
      });

      const block = response.content?.[0];
      if (!block || block.type !== 'text') {
        throw new Error('Unexpected response from Claude: no text content');
      }
      const parsed = parseJsonResponse(block.text);
      if (!parsed) {
        throw new Error(
          `Failed to parse JSON from Claude response: ${truncate(block.text, 200)}`
        );
      }
      return {
        title: pickString(parsed.title, title),
        description: pickString(parsed.description, ''),
      };
    },
  };
}

export function parseJsonResponse(text: string): Record<string, unknown> | null {
  if (!text) return null;
  let cleaned = text.trim();
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '');

  try {
    const parsed = JSON.parse(cleaned);
    if (isPlainObject(parsed)) return parsed;
  } catch {
    // fall through
  }

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (isPlainObject(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  return null;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function pickString(v: unknown, fallback: string): string {
  if (typeof v === 'string') {
    const trimmed = v.trim();
    return trimmed || fallback;
  }
  return fallback;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}
