import { describe, it, expect } from 'vitest';
import { pickHashtags } from '../src/modules/hashtagger.js';

describe('pickHashtags', () => {
  it('臨床試験記事には #臨床試験 が付く', () => {
    const tags = pickHashtags('Phase 3 clinical trial of new cancer drug');
    expect(tags).toContain('#臨床試験');
  });

  it('新薬承認記事には #新薬承認 が付く', () => {
    const tags = pickHashtags('FDA approved new immunotherapy for lung cancer');
    expect(tags).toContain('#新薬承認');
  });

  it('がん記事には #がん が付く', () => {
    const tags = pickHashtags('New cancer treatment shows 40% survival improvement');
    expect(tags).toContain('#がん');
  });

  it('ワクチン記事には #ワクチン が付く', () => {
    const tags = pickHashtags('New mRNA vaccine demonstrates 90% efficacy');
    expect(tags).toContain('#ワクチン');
  });

  it('感染症記事には #感染症 が付く', () => {
    const tags = pickHashtags('WHO declares epidemic outbreak in West Africa');
    expect(tags).toContain('#感染症');
  });

  it('何もマッチしなければ #医療 にフォールバック', () => {
    const tags = pickHashtags('全く関係ない話題のニュース');
    expect(tags).toEqual(['#医療']);
  });

  it('1 件しかマッチしないと #医療 で padding して 2 件になる', () => {
    const tags = pickHashtags('糖尿病患者向けの新しい治療法');
    expect(tags).toContain('#糖尿病');
    expect(tags).toContain('#医療');
  });

  it('複数マッチでも最大 3 件まで', () => {
    const tags = pickHashtags(
      'Phase 3 clinical trial: FDA approved cancer vaccine shows efficacy'
    );
    expect(tags.length).toBeLessThanOrEqual(3);
  });

  it('maxCount = 0 では空配列', () => {
    expect(pickHashtags('cancer vaccine trial', 0)).toEqual([]);
  });

  it('maxCount = 1 で 1 件だけ返る', () => {
    const tags = pickHashtags('Phase 3 clinical trial of cancer vaccine', 1);
    expect(tags).toHaveLength(1);
  });

  it('同じタグは重複しない', () => {
    const tags = pickHashtags('cancer がん oncology 腫瘍');
    const count = tags.filter((t) => t === '#がん').length;
    expect(count).toBe(1);
  });

  it('日本語 認知症 をマッチして #脳神経疾患 が付く', () => {
    expect(pickHashtags('アルツハイマー型認知症の早期診断に新バイオマーカー')).toContain(
      '#脳神経疾患'
    );
  });

  it('医療 AI 記事には #医療AI が付く', () => {
    expect(pickHashtags('Medical AI system outperforms radiologists in diagnosis')).toContain(
      '#医療AI'
    );
  });

  it('ガイドライン記事には #医療ガイドライン が付く', () => {
    expect(pickHashtags('Updated hypertension guideline from AHA')).toContain(
      '#医療ガイドライン'
    );
  });

  it('atopic dermatitis には #アトピー性皮膚炎 が付く', () => {
    expect(pickHashtags('Dupilumab for atopic dermatitis shows long-term safety')).toContain(
      '#アトピー性皮膚炎'
    );
  });

  it('psoriasis には #乾癬 が付く', () => {
    expect(pickHashtags('IL-17 inhibitor approved for plaque psoriasis')).toContain('#乾癬');
  });

  it('melanoma / skin cancer には #皮膚がん が付く', () => {
    expect(pickHashtags('Immunotherapy improves melanoma survival rates')).toContain('#皮膚がん');
    expect(pickHashtags('basal cell carcinoma treatment update')).toContain('#皮膚がん');
  });

  it('日本語 アトピー には #アトピー性皮膚炎 が付く', () => {
    expect(pickHashtags('アトピー性皮膚炎への新規治療')).toContain('#アトピー性皮膚炎');
  });

  it('日本語 乾癬 には #乾癬 が付く', () => {
    expect(pickHashtags('乾癬の生物学的製剤に関する長期試験')).toContain('#乾癬');
  });

  it('皮膚科一般 (eczema 等) には #皮膚科 が付く', () => {
    expect(pickHashtags('New rosacea treatment guidelines published')).toContain('#皮膚科');
  });

  it('dupilumab / JAK inhibitor には #皮膚科治療 が付く', () => {
    expect(pickHashtags('Dupilumab approved for new indication')).toContain('#皮膚科治療');
    expect(pickHashtags('JAK inhibitor shows rapid itch relief in skin disease')).toContain(
      '#皮膚科治療'
    );
  });
});
