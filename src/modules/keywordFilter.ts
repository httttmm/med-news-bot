import type { MedArticle } from '../types/index.js';

/**
 * 医療・医学関連のホワイトリストキーワード。
 * 大文字小文字を区別せず、title + contentSnippet に含まれていれば
 * 投稿候補とする。
 *
 * 「広く拾う」方針なので false negative より false positive 寄りに調整。
 * 雑音が多すぎたら個別に削除する。
 */
export const MEDICAL_KEYWORDS: readonly (string | RegExp)[] = [
  // ─── 臨床研究・論文
  'clinical trial',
  'randomized controlled trial',
  /\brct\b/i,
  /phase\s+[23]/i,
  /phase\s+ii/i,
  /phase\s+iii/i,
  'systematic review',
  'meta-analysis',
  '臨床試験',
  '治験',
  '無作為化',
  '系統的レビュー',
  'メタ解析',

  // ─── 薬・治療承認
  'fda approved',
  'fda approval',
  'ema approved',
  'drug approval',
  'approved by',
  'approval of',
  '承認',
  '新薬',
  '治療薬',

  // ─── ワクチン
  'vaccine',
  'vaccination',
  'immunization',
  'ワクチン',
  '予防接種',

  // ─── 疾患・症状 (主要)
  'cancer',
  'tumor',
  'tumour',
  'oncology',
  'cardiovascular',
  'heart disease',
  'heart failure',
  'myocardial',
  'diabetes',
  'stroke',
  'alzheimer',
  'dementia',
  'parkinson',
  'autoimmune',
  'inflammation',
  'inflammatory',
  'hypertension',
  'obesity',
  'がん',
  '癌',
  '腫瘍',
  '心疾患',
  '心不全',
  '糖尿病',
  '脳卒中',
  'アルツハイマー',
  '認知症',
  '高血圧',
  '肥満',

  // ─── 感染症・公衆衛生
  'infectious disease',
  'infection',
  'outbreak',
  'epidemic',
  'pandemic',
  'pathogen',
  'antimicrobial',
  'antibiotic',
  'antiviral',
  '感染症',
  '感染',
  'アウトブレイク',
  'パンデミック',
  '抗菌',
  '抗ウイルス',

  // ─── 診断・技術
  'diagnosis',
  'biomarker',
  'gene therapy',
  'cell therapy',
  'genomic',
  'crispr',
  'immunotherapy',
  'surgery',
  'surgical',
  '診断',
  'バイオマーカー',
  '遺伝子治療',
  '細胞療法',
  '免疫療法',
  '手術',
  'ゲノム',

  // ─── ガイドライン・公衆衛生機関
  'guideline',
  'who',
  /\bcdc\b/i,
  /\bnih\b/i,
  'public health',
  '厚生労働省',
  'ガイドライン',
  '公衆衛生',

  // ─── 有効性・安全性
  'efficacy',
  'effectiveness',
  'side effect',
  'adverse event',
  'mortality',
  'survival',
  '有効性',
  '安全性',
  '副作用',
  '有害事象',
  '死亡率',
  '生存率',

  // ─── 医療 AI・デジタルヘルス
  /medical\s+ai/i,
  /ai[\s-]+diagnosis/i,
  /digital\s+health/i,
  '医療AI',
  'デジタルヘルス',

  // ─── 免疫系
  'immunology',
  'immunity',
  /\bimmune\b/i,
  'allergy',
  'allergic',
  'allergen',
  'anaphylaxis',
  'hypersensitivity',
  'cytokine',
  'interleukin',
  /\bt[\s-]?cell/i,
  /\bb[\s-]?cell/i,
  /\bnk[\s-]?cell/i,
  'checkpoint inhibitor',
  /\bpd-1\b/i,
  /\bpd-l1\b/i,
  /\bctla-4\b/i,
  'monoclonal antibody',
  /\bmab\b/i,
  /\bige\b/i,
  'mast cell',
  'eosinophil',
  'autoantibody',
  'rheumatoid arthritis',
  'multiple sclerosis',
  'inflammatory bowel disease',
  /\bibd\b/i,
  "crohn",
  'ulcerative colitis',
  'immunodeficiency',
  'immune tolerance',
  '免疫',
  '自己免疫',
  'アレルギー',
  'アナフィラキシー',
  'サイトカイン',
  '関節リウマチ',
  '多発性硬化症',
  '炎症性腸疾患',
  '免疫不全',
  '抗体薬',
  'モノクローナル抗体',
  '免疫寛容',

  // ─── 皮膚科・皮膚疾患
  'dermatology',
  'dermatitis',
  'eczema',
  'atopic dermatitis',
  'psoriasis',
  'acne',
  'rosacea',
  'melanoma',
  'skin cancer',
  'basal cell carcinoma',
  'squamous cell carcinoma',
  'alopecia',
  'urticaria',
  'hives',
  'vitiligo',
  'pemphigus',
  'lupus',
  'scleroderma',
  'hidradenitis',
  'pruritus',
  'wound healing',
  'skin microbiome',
  'dupilumab',
  'biologic',
  'JAK inhibitor',
  /\bjak\d?\b/i,
  'IL-4',
  'IL-13',
  'IL-17',
  'IL-31',
  '皮膚科',
  '皮膚炎',
  '皮膚疾患',
  '皮膚病',
  'アトピー',
  'アトピー性皮膚炎',
  '乾癬',
  'ニキビ',
  '酒さ',
  '皮膚がん',
  'メラノーマ',
  '悪性黒色腫',
  '脱毛症',
  '蕁麻疹',
  '白斑',
  '掻痒',
  'かゆみ',
  '創傷治癒',
  '皮膚常在菌',
  'デュピルマブ',
  '生物学的製剤',
  'JAK阻害',
];

/**
 * 記事が医療キーワードホワイトリストに該当するか判定する。
 */
export function matchesMedicalTopic(article: MedArticle): boolean {
  const haystack = `${article.title} ${article.contentSnippet ?? ''}`.toLowerCase();
  for (const kw of MEDICAL_KEYWORDS) {
    if (typeof kw === 'string') {
      if (haystack.includes(kw.toLowerCase())) return true;
    } else if (kw.test(haystack)) {
      return true;
    }
  }
  return false;
}

/**
 * 記事配列を「医療関連と判定されたもの」だけに絞る。
 * disabled = true なら全件そのまま返す (フィルタ無効化)。
 */
export function filterByMedicalTopic(
  articles: MedArticle[],
  disabled = false
): MedArticle[] {
  if (disabled) return articles;
  return articles.filter(matchesMedicalTopic);
}
