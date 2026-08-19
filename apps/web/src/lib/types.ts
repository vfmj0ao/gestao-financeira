export type GroupSummary = {
  id: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  permissions: string[];
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  groups: GroupSummary[];
};

export type SessionResponse = {
  accessToken: string;
  user: AuthUser;
};

export type GroupMember = {
  id: string;
  name: string;
  email: string;
  role: GroupSummary['role'];
  permissions: string[];
};

export type InvitePreview = {
  email: string;
  groupName: string;
  role: Exclude<GroupSummary['role'], 'OWNER'>;
  expiresAt: string;
};

export type Category = {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
};

export type TransactionItem = {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  description: string;
  occurredOn: string;
  category: { id: string; name: string } | null;
};

export type MonthSummary = {
  month: string;
  income: string;
  expense: string;
  balance: string;
};

export type InvestmentItem = {
  id: string;
  name: string;
  ticker: string | null;
  amount: string;
  quantity: string | null;
  investedOn: string;
};

export type InvestmentSummary = {
  total: string;
};

export type ReportCategoryTotal = {
  name: string;
  amount: string;
};

export type ReportMonthRow = {
  month: string;
  income: string;
  expense: string;
  balance: string;
  accumulated: string;
};

export type GroupReport = {
  from: string;
  to: string;
  months: ReportMonthRow[];
  totals: {
    income: string;
    expense: string;
    balance: string;
  };
  expenseByCategory: ReportCategoryTotal[];
  incomeByCategory: ReportCategoryTotal[];
  investmentsTotal: string | null;
};

export type BudgetItem = {
  categoryId: string;
  name: string;
  limit: string | null;
  spent: string;
  remaining: string | null;
  over: boolean;
};

export type BudgetMonth = {
  month: string;
  items: BudgetItem[];
};
