type ChartClickState = {
  activePayload?: ReadonlyArray<{
    payload?: {
      month?: unknown;
    };
  }>;
};

export function monthFromChartClick(state: unknown) {
  if (!state || typeof state !== 'object') {
    return undefined;
  }
  const month = (state as ChartClickState).activePayload?.[0]?.payload?.month;
  return typeof month === 'string' ? month : undefined;
}
