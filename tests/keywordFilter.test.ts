import { describe, it, expect } from 'vitest';
import {
  matchesMedicalTopic,
  filterByMedicalTopic,
} from '../src/modules/keywordFilter.js';
import type { MedArticle } from '../src/types/index.js';

function makeArticle(overrides: Partial<MedArticle> = {}): MedArticle {
  return {
    title: 'sample',
    url: 'https://example.com/' + Math.random(),
    contentSnippet: '',
    source: { name: 'test', url: 'https://example.com/feed' },
    language: 'en',
    ...overrides,
  };
}

describe('matchesMedicalTopic', () => {
  it('clinical trial をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: 'Phase 3 clinical trial shows efficacy of new drug' })
      )
    ).toBe(true);
  });

  it('FDA approved をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: 'FDA approved new cancer therapy' })
      )
    ).toBe(true);
  });

  it('日本語 承認 をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: '新しい抗がん剤が厚生労働省に承認される' })
      )
    ).toBe(true);
  });

  it('日本語 ワクチン をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: 'インフルエンザワクチンの有効性に関する研究' })
      )
    ).toBe(true);
  });

  it('contentSnippet の中身もマッチ対象', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({
          title: 'New research published',
          contentSnippet: 'A randomized controlled trial demonstrated significant mortality reduction',
        })
      )
    ).toBe(true);
  });

  it('医療と無関係なタイトルは false', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: 'How to bake the perfect bread loaf' })
      )
    ).toBe(false);
    expect(
      matchesMedicalTopic(makeArticle({ title: 'JavaScript framework comparison' }))
    ).toBe(false);
  });

  it('大文字小文字を区別しない', () => {
    expect(
      matchesMedicalTopic(makeArticle({ title: 'CANCER treatment advances' }))
    ).toBe(true);
  });

  it('outbreak / pandemic をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: 'WHO declares new outbreak in Southeast Asia' })
      )
    ).toBe(true);
  });

  it('meta-analysis をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: 'Meta-analysis of statin therapy reduces cardiovascular risk' })
      )
    ).toBe(true);
  });

  it('日本語 感染症 をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: '新興感染症の国内発生状況について' })
      )
    ).toBe(true);
  });

  it('日本語 副作用 をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: '新薬の副作用に関する安全性報告' })
      )
    ).toBe(true);
  });

  it('gene therapy をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: 'CRISPR-based gene therapy shows promise for rare disease' })
      )
    ).toBe(true);
  });

  it('guideline をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: 'Updated AHA guideline for hypertension management' })
      )
    ).toBe(true);
  });

  it('atopic dermatitis をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: 'Dupilumab shows sustained efficacy in atopic dermatitis' })
      )
    ).toBe(true);
  });

  it('psoriasis をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: 'New IL-17 inhibitor approved for plaque psoriasis' })
      )
    ).toBe(true);
  });

  it('日本語 アトピー をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: 'アトピー性皮膚炎の新規治療薬が承認' })
      )
    ).toBe(true);
  });

  it('melanoma をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: 'Combination immunotherapy improves melanoma survival' })
      )
    ).toBe(true);
  });

  it('JAK inhibitor をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: 'JAK inhibitor demonstrates rapid itch relief in eczema' })
      )
    ).toBe(true);
  });

  it('日本語 乾癬 をマッチ', () => {
    expect(
      matchesMedicalTopic(
        makeArticle({ title: '乾癬に対する生物学的製剤の長期安全性データ' })
      )
    ).toBe(true);
  });
});

describe('filterByMedicalTopic', () => {
  it('該当記事のみ通す', () => {
    const articles = [
      makeArticle({ title: 'New vaccine approved for influenza' }),
      makeArticle({ title: 'New cookie recipe' }),
      makeArticle({ title: 'Clinical trial results for cancer drug' }),
    ];
    const filtered = filterByMedicalTopic(articles);
    expect(filtered).toHaveLength(2);
  });

  it('disabled=true なら全件そのまま返す', () => {
    const articles = [
      makeArticle({ title: 'irrelevant' }),
      makeArticle({ title: 'also irrelevant' }),
    ];
    expect(filterByMedicalTopic(articles, /* disabled */ true)).toHaveLength(2);
  });
});
