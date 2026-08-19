'use client';

import { compareAmounts, trendAriaLabel, trendTone, type MetricSense } from '@/lib/trend';

export function TrendBadge({
  current,
  previous,
  sense,
}: {
  current: string;
  previous: string;
  sense: MetricSense;
}) {
  const trend = compareAmounts(current, previous);
  const tone = trendTone(trend, sense);
  const glyph =
    trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : trend.direction === 'flat' ? '→' : '·';
  const label = trend.percent === null ? '—' : `${trend.percent}%`;

  const toneClass =
    tone === 'good'
      ? 'text-emerald-700 dark:text-emerald-400'
      : tone === 'bad'
        ? 'text-red-700 dark:text-red-400'
        : 'text-zinc-500 dark:text-zinc-400';

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${toneClass}`}
      aria-label={trendAriaLabel(trend)}
      title={trendAriaLabel(trend)}
    >
      <span aria-hidden="true">{glyph}</span>
      {label}
    </span>
  );
}
