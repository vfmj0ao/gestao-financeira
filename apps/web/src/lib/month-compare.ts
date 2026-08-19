import { formatBRL, formatMonthLabel } from '@/lib/money';

function toCents(amount: string) {
  const negative = amount.startsWith('-');
  const raw = negative ? amount.slice(1) : amount;
  const [whole = '0', fraction = '00'] = raw.split('.');
  const cents = Number.parseInt(`${whole}${`${fraction}00`.slice(0, 2)}`, 10);
  return negative ? -cents : cents;
}

export function describeChange(current: string, previous: string) {
  const now = toCents(current);
  const before = toCents(previous);
  if (before === 0 && now === 0) {
    return 'Igual ao mês passado';
  }
  if (before === 0) {
    return 'Sem valor no mês passado para comparar';
  }
  const delta = now - before;
  const percent = Math.abs(Math.round((delta / before) * 100));
  if (delta === 0) {
    return 'Igual ao mês passado';
  }
  const direction = delta > 0 ? 'a mais' : 'a menos';
  return `${percent}% ${direction} que ${formatBRL(previous)}`;
}

export function financialInsight(input: {
  currentMonth: string;
  previousMonth: string;
  currentIncome: string;
  previousIncome: string;
  currentExpense: string;
  previousExpense: string;
  currentBalance: string;
  previousBalance: string;
}) {
  const expenseNow = toCents(input.currentExpense);
  const expenseBefore = toCents(input.previousExpense);
  const incomeNow = toCents(input.currentIncome);
  const incomeBefore = toCents(input.previousIncome);
  const balanceNow = toCents(input.currentBalance);
  const previousLabel = formatMonthLabel(input.previousMonth);

  if (expenseBefore === 0 && incomeBefore === 0) {
    return `Ainda não há ${previousLabel} para comparar. Este mês serve de ponto de partida.`;
  }

  if (expenseNow < expenseBefore && incomeNow >= incomeBefore) {
    return `Você gastou menos que em ${previousLabel} e manteve ou aumentou as entradas. Isso indica mais controle neste mês.`;
  }
  if (expenseNow > expenseBefore && incomeNow <= incomeBefore) {
    return `As saídas subiram em relação a ${previousLabel} e as entradas não acompanharam. Vale revisar os gastos.`;
  }
  if (balanceNow > toCents(input.previousBalance)) {
    return `O que sobrou neste mês foi maior que em ${previousLabel}.`;
  }
  if (balanceNow < toCents(input.previousBalance)) {
    return `Sobra menos do que em ${previousLabel}. As saídas cresceram ou as entradas caíram.`;
  }
  return `O resultado ficou parecido com ${previousLabel}.`;
}
