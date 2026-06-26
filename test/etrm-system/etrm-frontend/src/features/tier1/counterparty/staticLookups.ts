/**
 * TEMPORARY. currency_id and credit_rating_id are real FKs to surrogate
 * integer keys (not codes), so unlike legal_entity.base_currency (a CHAR(3)
 * FK directly to currency.currency_code, fine as a plain text input) these
 * genuinely need an id-based picker. There's no live Tier 2 endpoint to
 * fetch them from yet, so these are hardcoded here as a clearly-labeled
 * stopgap. Replace with a real `useReferenceData('currency')` /
 * `useReferenceData('credit_rating')` call once the Tier 2 generic screen
 * and its API exist — the ids below are arbitrary and will NOT match
 * whatever the real currency/credit_rating tables assign.
 */

export interface CurrencyLookup {
  currencyId: number;
  currencyCode: string;
  currencyName: string;
}

export const CURRENCY_LOOKUP: CurrencyLookup[] = [
  { currencyId: 1, currencyCode: 'USD', currencyName: 'US Dollar' },
  { currencyId: 2, currencyCode: 'GBP', currencyName: 'British Pound' },
  { currencyId: 3, currencyCode: 'EUR', currencyName: 'Euro' },
  { currencyId: 4, currencyCode: 'SGD', currencyName: 'Singapore Dollar' },
  { currencyId: 5, currencyCode: 'JPY', currencyName: 'Japanese Yen' },
  { currencyId: 6, currencyCode: 'CHF', currencyName: 'Swiss Franc' },
  { currencyId: 7, currencyCode: 'AED', currencyName: 'UAE Dirham' },
];

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
