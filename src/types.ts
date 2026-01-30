export type Mapping = {
  extract: {
    dateCol: string;
    conceptCol: string;
    amountMode: 'single' | 'debe-haber';
    amountCol: string;
    debeCol: string;
    haberCol: string;
  };
  system: {
    issueDateCol: string;
    dueDateCol: string;
    amountMode: 'single' | 'debe-haber';
    amountCol: string;
    debeCol: string;
    haberCol: string;
  };
};

export type RunPayload = {
  title?: string;
  bankName?: string;
  accountRef?: string;
  windowDays?: number;
  cutDate?: string;
  extract: {
    rows: Record<string, unknown>[];
    mapping: Mapping['extract'];
    excludeConcepts?: string[];
  };
  system: {
    rows: Record<string, unknown>[];
    mapping: Mapping['system'];
  };
};

export type RunSummary = {
  runId: string;
  matched: number;
  onlyExtract: number;
  systemOverdue: number;
  systemDeferred: number;
};

export type ReconciliationRun = {
  id: string;
  title?: string | null;
  bankName?: string | null;
  accountRef?: string | null;
  windowDays: number;
  cutDate?: string | null;
  createdAt: string;
  createdById: string;
};

export type ExpenseRule = {
  id: string;
  pattern: string;
  isRegex: boolean;
  caseSensitive: boolean;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  rules: ExpenseRule[];
};

export type Message = {
  id: string;
  body: string;
  createdAt: string;
  author: { email: string };
};

export type ExtractLine = {
  id: string;
  date: string | null;
  concept: string | null;
  amount: number;
  category?: { name: string } | null;
};

export type SystemLine = {
  id: string;
  issueDate: string | null;
  dueDate: string | null;
  amount: number;
};

export type Match = {
  extractLineId: string;
  systemLineId: string;
  deltaDays: number;
};

export type UnmatchedExtract = {
  extractLineId: string;
};

export type UnmatchedSystem = {
  systemLineId: string;
  status: 'OVERDUE' | 'DEFERRED';
};

export type RunDetail = {
  id: string;
  title?: string;
  createdAt: string;
  extractLines: ExtractLine[];
  systemLines: SystemLine[];
  matches: Match[];
  unmatchedExtract: UnmatchedExtract[];
  unmatchedSystem: UnmatchedSystem[];
  messages: Message[];
};
