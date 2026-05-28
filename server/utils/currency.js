const RATES = {
  INR: 1.0,
  USD: 83.0,
  EUR: 90.0,
  GBP: 105.0,
  AUD: 55.0,
  CAD: 61.0,
  SGD: 61.5,
  JPY: 0.53
};

const convertCurrency = (amount, fromCurrency, toCurrency) => {
  const from = (fromCurrency || 'INR').toUpperCase();
  const to = (toCurrency || 'INR').toUpperCase();

  if (from === to) return amount;

  const rateFrom = RATES[from] || 1.0;
  const rateTo = RATES[to] || 1.0;

  // Convert to INR first, then convert to target currency
  const amountInINR = amount * rateFrom;
  const targetAmount = amountInINR / rateTo;

  return Math.round(targetAmount * 100) / 100; // round to 2 decimal places
};

module.exports = { convertCurrency, RATES };
