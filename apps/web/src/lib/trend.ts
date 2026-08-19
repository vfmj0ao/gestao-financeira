export function amountToCents(amount: string) {
  const negative = amount.startsWith('-');
  const raw = negative ? amount.slice(1) : amount;
  const [whole = '0', fraction = '00'] = raw.split('.');
  const cents = Number.parseInt(`${whole}${`${fraction}00`.slice(0, 2)}`, 10);
  return negative ? -cents : cents;
}

export type AmountTrend = {
  direction: 'up' | 'down' | 'flat' | 'new';
  percent: number | null;
};

export function compareAmounts(current: string, previous: string): AmountTrend {
  const now = amountToCents(current);
  const before = amountToCents(previous);
  if (before === 0 && now === 0) {
    return { direction: 'flat', percent: 0 };
  }
  if (before === 0) {
    return { direction: 'new', percent: null };
  }
  const delta = now - before;
  if (delta === 0) {
    return { direction: 'flat', percent: 0 };
  }
  return {
    direction: delta > 0 ? 'up' : 'down',
    percent: Math.abs(Math.round((delta / before) * 100)),
  };
}

export type MetricSense = 'higher-is-better' | 'lower-is-better';

export function trendTone(
  trend: AmountTrend,
  sense: MetricSense,
): 'good' | 'bad' | 'neutral' {
  if (trend.direction === 'flat' || trend.direction === 'new') {
    return 'neutral';
  }
  const rose = trend.direction === 'up';
  if (sense === 'higher-is-better') {
    return rose ? 'good' : 'bad';
  }
  return rose ? 'bad' : 'good';
}

export function trendAriaLabel(trend: AmountTrend) {
  if (trend.direction === 'new') {
    return 'Sem valor no mês anterior';
  }
  if (trend.direction === 'flat') {
    return 'Estável em relação ao mês anterior';
  }
  const percent = trend.percent ?? 0;
  return trend.direction === 'up'
    ? `${percent}% acima do mês anterior`
    : `${percent}% abaixo do mês anterior`;
}
