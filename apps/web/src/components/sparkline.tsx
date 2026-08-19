export function Sparkline({
  values,
  stroke,
}: {
  values: number[];
  stroke: string;
}) {
  const width = 160;
  const height = 40;
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const coords = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / span) * (height - 6) - 3;
    return { x, y };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-10 w-full"
      aria-hidden="true"
      focusable="false"
    >
      <polygon fill={stroke} fillOpacity="0.12" points={area} />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={line}
      />
    </svg>
  );
}
