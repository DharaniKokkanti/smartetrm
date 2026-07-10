/**
 * TEMPORARY. credit_rating_id is a real FK to a surrogate integer key (not
 * a code), and there's no live Tier 2 endpoint to fetch it from yet, so it's
 * hardcoded here as a clearly-labeled stopgap. Replace with a real
 * `useReferenceData('credit_rating')` call once the Tier 2 generic screen
 * and its API exist — the ids below are arbitrary and will NOT match
 * whatever the real credit_rating table assigns.
 *
 * (currency_id/currency_code no longer need this treatment — every currency
 * field in this app now goes through the real `useCurrencies()` hook,
 * `@features/reference/currencies/hooks`.)
 */

export interface CreditRatingLookup {
  creditRatingId: number;
  agency: string;
  rating: string;
  riskCategory: 'INVESTMENT_GRADE' | 'SPECULATIVE' | 'DEFAULT' | 'UNRATED';
}

export const CREDIT_RATING_LOOKUP: CreditRatingLookup[] = [
  { creditRatingId: 1, agency: "S&P", rating: 'AAA', riskCategory: 'INVESTMENT_GRADE' },
  { creditRatingId: 2, agency: "S&P", rating: 'AA', riskCategory: 'INVESTMENT_GRADE' },
  { creditRatingId: 3, agency: "S&P", rating: 'A', riskCategory: 'INVESTMENT_GRADE' },
  { creditRatingId: 4, agency: "S&P", rating: 'BBB', riskCategory: 'INVESTMENT_GRADE' },
  { creditRatingId: 5, agency: "S&P", rating: 'BB', riskCategory: 'SPECULATIVE' },
  { creditRatingId: 6, agency: "S&P", rating: 'B', riskCategory: 'SPECULATIVE' },
  { creditRatingId: 7, agency: "S&P", rating: 'CCC', riskCategory: 'SPECULATIVE' },
  { creditRatingId: 8, agency: 'Internal', rating: 'Unrated', riskCategory: 'UNRATED' },
];
