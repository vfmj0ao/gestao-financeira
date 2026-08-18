export function formatBRL(amount: string) {
  const negative = amount.startsWith('-');
  const raw = negative ? amount.slice(1) : amount;
  const [whole, fraction = '00'] = raw.split('.');
  const cents = `${fraction}00`.slice(0, 2);
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}R$\u00a0${formattedWhole},${cents}`;
}

export function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function todayISODate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const MONTH_LABELS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export function formatMonthLabel(month: string) {
  const [year, monthPart] = month.split('-');
  const index = Number(monthPart) - 1;
  return `${MONTH_LABELS[index] ?? monthPart}/${year}`;
}

/** Conversão só para eixos/tooltips de gráfico — não usar em cálculos. */
export function chartNumber(amount: string) {
  return Number.parseFloat(amount);
}
