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
