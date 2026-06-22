/**
 * 記事の内容にマッチするハッシュタグを優先度順に選定する。
 * 投稿本文に最大 N 個まで含める想定。
 *
 * - 同じタグは重複しない
 * - 高優先度のルールから順にマッチを試す
 * - 指定件数に満たなければ #医療 で 1 件だけ補完する
 */

interface HashtagRule {
  pattern: RegExp;
  tag: string;
}

/** デフォルト最大ハッシュタグ数 */
export const DEFAULT_MAX_HASHTAGS = 3;

/** 件数が満たないときに padding として追加する汎用タグ */
const DEFAULT_TAG = '医療';

/**
 * ハッシュタグ判定ルール (優先度順)。
 * 上にあるルールほど優先される。
 */
export const HASHTAG_RULES: readonly HashtagRule[] = [
  // ─── 臨床研究
  {
    pattern: /clinical[\s-]?trial|randomized|rct|phase[\s-]?[23ii|iii]/i,
    tag: '臨床試験',
  },
  {
    pattern: /systematic[\s-]?review|meta[\s-]?analysis|メタ解析|系統的レビュー/i,
    tag: '医学研究',
  },

  // ─── 承認・新薬
  {
    pattern: /fda[\s-]?approv|ema[\s-]?approv|drug[\s-]?approv|承認|新薬|治療薬/i,
    tag: '新薬承認',
  },

  // ─── ワクチン
  { pattern: /vaccine|vaccination|immunization|ワクチン|予防接種/i, tag: 'ワクチン' },

  // ─── がん・腫瘍
  { pattern: /cancer|tumor|tumour|oncolog|がん|癌|腫瘍/i, tag: 'がん' },

  // ─── 心臓・循環器
  {
    pattern: /cardiovascular|heart[\s-]?(?:disease|failure)|myocardial|coronary|cardiac|心疾患|心不全|循環器/i,
    tag: '心臓病',
  },

  // ─── 感染症
  {
    pattern: /outbreak|pandemic|epidemic|infectious[\s-]?disease|感染症|パンデミック|アウトブレイク/i,
    tag: '感染症',
  },

  // ─── 代謝疾患
  { pattern: /diabetes|糖尿病/i, tag: '糖尿病' },

  // ─── 脳神経疾患
  {
    pattern: /alzheimer|dementia|parkinson|stroke|脳卒中|認知症|アルツハイマー/i,
    tag: '脳神経疾患',
  },

  // ─── 精密医療・遺伝子
  {
    pattern: /gene[\s-]?therapy|genomic|crispr|cell[\s-]?therapy|immunotherapy|遺伝子治療|細胞療法|免疫療法|ゲノム/i,
    tag: '精密医療',
  },

  // ─── 医療 AI
  {
    pattern: /medical[\s-]?ai|ai[\s-]?diagnosis|digital[\s-]?health|医療AI|AI診断|デジタルヘルス/i,
    tag: '医療AI',
  },

  // ─── 免疫系
  {
    pattern: /allerg|anaphylaxis|hypersensitivity|アレルギー|アナフィラキシー/i,
    tag: 'アレルギー',
  },
  {
    pattern: /rheumatoid[\s-]?arthritis|関節リウマチ/i,
    tag: 'リウマチ',
  },
  {
    pattern: /multiple[\s-]?sclerosis|多発性硬化症/i,
    tag: '多発性硬化症',
  },
  {
    pattern: /inflammatory[\s-]?bowel|crohn|ulcerative[\s-]?colitis|\bibd\b|炎症性腸疾患/i,
    tag: '炎症性腸疾患',
  },
  {
    pattern: /autoimmun|autoantibody|自己免疫/i,
    tag: '自己免疫疾患',
  },
  {
    pattern: /checkpoint[\s-]?inhibitor|pd-1|pd-l1|ctla-4|monoclonal[\s-]?antibody|\bmab\b|免疫チェックポイント|モノクローナル抗体/i,
    tag: '免疫療法',
  },
  {
    pattern: /immunology|cytokine|interleukin|t[\s-]?cell|b[\s-]?cell|mast[\s-]?cell|eosinophil|免疫学|サイトカイン/i,
    tag: '免疫学',
  },

  // ─── 皮膚科・皮膚疾患
  {
    pattern: /atopic[\s-]?dermatitis|eczema|アトピー性皮膚炎|アトピー性/i,
    tag: 'アトピー性皮膚炎',
  },
  {
    pattern: /psoriasis|乾癬/i,
    tag: '乾癬',
  },
  {
    pattern: /melanoma|skin[\s-]?cancer|basal[\s-]?cell|squamous[\s-]?cell|メラノーマ|悪性黒色腫|皮膚がん/i,
    tag: '皮膚がん',
  },
  {
    pattern: /alopecia|脱毛症/i,
    tag: '脱毛症',
  },
  {
    pattern: /dermatology|dermatitis|rosacea|vitiligo|urticaria|hidradenitis|pemphigus|scleroderma|皮膚科|皮膚炎|皮膚疾患|皮膚病|酒さ|白斑|蕁麻疹/i,
    tag: '皮膚科',
  },
  {
    pattern: /dupilumab|jak[\s-]?inhibitor|biologic.*skin|skin.*biologic|デュピルマブ|JAK阻害|生物学的製剤/i,
    tag: '皮膚科治療',
  },

  // ─── ガイドライン・公衆衛生
  {
    pattern: /guideline|public[\s-]?health|ガイドライン|公衆衛生/i,
    tag: '医療ガイドライン',
  },
];

/**
 * 与えられたテキストに含まれるキーワードから、最大 maxCount 個の
 * 関連ハッシュタグを返す。各タグは `#xxx` 形式の文字列。
 */
export function pickHashtags(
  text: string,
  maxCount = DEFAULT_MAX_HASHTAGS
): string[] {
  if (maxCount <= 0) return [];

  const tags: string[] = [];
  const seen = new Set<string>();

  for (const rule of HASHTAG_RULES) {
    if (rule.pattern.test(text) && !seen.has(rule.tag)) {
      tags.push(rule.tag);
      seen.add(rule.tag);
      if (tags.length >= maxCount) break;
    }
  }

  if (tags.length < maxCount && !seen.has(DEFAULT_TAG)) {
    tags.push(DEFAULT_TAG);
  }

  return tags.map((t) => `#${t}`);
}
