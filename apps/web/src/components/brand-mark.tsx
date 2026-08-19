import Link from 'next/link';

export function BrandMark({
  href,
  compact = false,
}: {
  href: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 text-foreground">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-fg"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 11.5 12 5l8 6.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10.5V19h12v-8.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 19v-4h4v4" strokeLinecap="round" />
        </svg>
      </span>
      {compact ? (
        <span className="text-sm font-semibold tracking-tight">Gestão</span>
      ) : (
        <span className="leading-tight">
          <span className="block font-display text-base font-semibold tracking-tight">
            Gestão
          </span>
          <span className="block text-[11px] text-muted">Finanças em família</span>
        </span>
      )}
    </Link>
  );
}
