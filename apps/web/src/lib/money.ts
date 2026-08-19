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

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function formatMonthLabel(month: string) {
  const [year, monthPart] = month.split('-');
  const index = Number(monthPart) - 1;
  return `${MONTH_LABELS[index] ?? monthPart}/${year}`;
}

export function formatMonthTitle(month: string) {
  const [year, monthPart] = month.split('-');
  const index = Number(monthPart) - 1;
  return `${MONTH_NAMES[index] ?? monthPart} ${year}`;
}

export function formatIsoDate(isoDate: string) {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}

export function centsToAmount(cents: number) {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

export function shiftMonth(month: string, delta: number) {
  const [year, monthPart] = month.split('-').map(Number);
  const date = new Date(year, (monthPart ?? 1) - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function maskMoney(amount: string, hidden: boolean) {
  return hidden ? 'R$\u00a0•••' : formatBRL(amount);
}

/** Conversão só para eixos/tooltips de gráfico — não usar em cálculos. */
export function chartNumber(amount: string) {
  return Number.parseFloat(amount);
}
