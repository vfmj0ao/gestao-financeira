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
      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      : tone === 'bad'
        ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300'
        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${toneClass}`}
      aria-label={trendAriaLabel(trend)}
      title={trendAriaLabel(trend)}
    >
      <span aria-hidden="true">{glyph}</span>
      {label}
    </span>
  );
}
