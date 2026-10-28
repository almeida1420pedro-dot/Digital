import { CurrencyDisplayMode, StoreConfig } from '../types';

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatSecondary(
  amountUSD: number,
  rate: number,
  symbol: string = 'Bs.',
  code: string = 'VES'
): string {
  const converted = amountUSD * rate;
  const formatted = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(converted);

  return `${symbol} ${formatted}`;
}

export function formatDualPrice(
  amountUSD: number,
  config: Pick<StoreConfig, 'baseExchangeRate' | 'secondaryCurrencySymbol' | 'secondaryCurrencyCode'>,
  mode: CurrencyDisplayMode = 'dual'
): {
  usdText: string;
  secondaryText: string;
  combinedText: string;
} {
  const usdText = formatUSD(amountUSD);
  const secondaryText = formatSecondary(
    amountUSD,
    config.baseExchangeRate,
    config.secondaryCurrencySymbol,
    config.secondaryCurrencyCode
  );

  let combinedText = '';
  if (mode === 'usd') {
    combinedText = usdText;
  } else if (mode === 'secondary') {
    combinedText = secondaryText;
  } else {
    combinedText = `${usdText} · ${secondaryText}`;
  }

  return {
    usdText,
    secondaryText,
    combinedText
  };
}
