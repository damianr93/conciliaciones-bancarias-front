import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RunDetail, RunSummary, ReconciliationRun } from '@/types';

interface FileState {
  file: File | null;
  sheets: string[];
  selectedSheet: string;
  headerRow: number;
  rows: Record<string, unknown>[];
  columns: string[];
  isLoading: boolean;
  error: string | null;
}

interface ReconciliationsState {
  extract: FileState;
  system: FileState;
  mapping: {
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
      descriptionCol: string;
      amountMode: 'single' | 'debe-haber';
      amountCol: string;
      debeCol: string;
      haberCol: string;
    };
  };
  windowDays: number;
  cutDate: string;
  bankName: string;
  excludeConcepts: string[];
  currentRun: {
    summary: RunSummary | null;
    detail: RunDetail | null;
    isLoading: boolean;
    error: string | null;
  };
  runs: ReconciliationRun[];
}

const defaultFileState: FileState = {
  file: null,
  sheets: [],
  selectedSheet: '',
  headerRow: 1,
  rows: [],
  columns: [],
  isLoading: false,
  error: null,
};

const initialState: ReconciliationsState = {
  extract: defaultFileState,
  system: defaultFileState,
  mapping: {
    extract: {
      dateCol: '',
      conceptCol: '',
      amountMode: 'single',
      amountCol: '',
      debeCol: '',
      haberCol: '',
    },
    system: {
      issueDateCol: '',
      dueDateCol: '',
      descriptionCol: '',
      amountMode: 'single',
      amountCol: '',
      debeCol: '',
      haberCol: '',
    },
  },
  windowDays: 0,
  cutDate: '',
  bankName: '',
  excludeConcepts: [],
  currentRun: {
    summary: null,
    detail: null,
    isLoading: false,
    error: null,
  },
  runs: [],
};

const reconciliationsSlice = createSlice({
  name: 'reconciliations',
  initialState,
  reducers: {
    setExtractFile: (state, action: PayloadAction<File | null>) => {
      state.extract.file = action.payload;
      if (!action.payload) {
        state.extract.sheets = [];
        state.extract.selectedSheet = '';
        state.extract.rows = [];
        state.extract.columns = [];
      }
    },
    setExtractFileData: (state, action: PayloadAction<{
      sheets: string[];
      rows: Record<string, unknown>[];
      selectedSheet?: string;
    }>) => {
      state.extract.sheets = action.payload.sheets;
      state.extract.rows = action.payload.rows;
      state.extract.columns = action.payload.rows.length ? Object.keys(action.payload.rows[0]) : [];
      state.extract.selectedSheet = action.payload.selectedSheet || action.payload.sheets[0] || '';
      state.extract.isLoading = false;
      state.extract.error = null;
    },
    setExtractLoading: (state, action: PayloadAction<boolean>) => {
      state.extract.isLoading = action.payload;
    },
    setExtractError: (state, action: PayloadAction<string | null>) => {
      state.extract.error = action.payload;
      state.extract.isLoading = false;
    },
    setExtractSheet: (state, action: PayloadAction<string>) => {
      state.extract.selectedSheet = action.payload;
    },
    setExtractHeaderRow: (state, action: PayloadAction<number>) => {
      state.extract.headerRow = action.payload;
    },
    setSystemFile: (state, action: PayloadAction<File | null>) => {
      state.system.file = action.payload;
      if (!action.payload) {
        state.system.sheets = [];
        state.system.selectedSheet = '';
        state.system.rows = [];
        state.system.columns = [];
      }
    },
    setSystemFileData: (state, action: PayloadAction<{
      sheets: string[];
      rows: Record<string, unknown>[];
      selectedSheet?: string;
    }>) => {
      state.system.sheets = action.payload.sheets;
      state.system.rows = action.payload.rows;
      state.system.columns = action.payload.rows.length ? Object.keys(action.payload.rows[0]) : [];
      state.system.selectedSheet = action.payload.selectedSheet || action.payload.sheets[0] || '';
      state.system.isLoading = false;
      state.system.error = null;
    },
    setSystemLoading: (state, action: PayloadAction<boolean>) => {
      state.system.isLoading = action.payload;
    },
    setSystemError: (state, action: PayloadAction<string | null>) => {
      state.system.error = action.payload;
      state.system.isLoading = false;
    },
    setSystemSheet: (state, action: PayloadAction<string>) => {
      state.system.selectedSheet = action.payload;
    },
    setSystemHeaderRow: (state, action: PayloadAction<number>) => {
      state.system.headerRow = action.payload;
    },
    setMapping: (state, action: PayloadAction<ReconciliationsState['mapping']>) => {
      state.mapping = action.payload;
    },
    updateExtractMapping: (state, action: PayloadAction<Partial<ReconciliationsState['mapping']['extract']>>) => {
      state.mapping.extract = { ...state.mapping.extract, ...action.payload };
    },
    updateSystemMapping: (state, action: PayloadAction<Partial<ReconciliationsState['mapping']['system']>>) => {
      state.mapping.system = { ...state.mapping.system, ...action.payload };
    },
    setWindowDays: (state, action: PayloadAction<number>) => {
      state.windowDays = action.payload;
    },
    setCutDate: (state, action: PayloadAction<string>) => {
      state.cutDate = action.payload;
    },
    setBankName: (state, action: PayloadAction<string>) => {
      state.bankName = action.payload;
    },
    setExcludeConcepts: (state, action: PayloadAction<string[]>) => {
      state.excludeConcepts = action.payload;
    },
    setCurrentRunSummary: (state, action: PayloadAction<RunSummary>) => {
      state.currentRun.summary = action.payload;
      state.currentRun.isLoading = false;
      state.currentRun.error = null;
    },
    setCurrentRunDetail: (state, action: PayloadAction<RunDetail>) => {
      state.currentRun.detail = action.payload;
    },
    setCurrentRunLoading: (state, action: PayloadAction<boolean>) => {
      state.currentRun.isLoading = action.payload;
    },
    setCurrentRunError: (state, action: PayloadAction<string | null>) => {
      state.currentRun.error = action.payload;
      state.currentRun.isLoading = false;
    },
    setRuns: (state, action: PayloadAction<ReconciliationRun[]>) => {
      state.runs = action.payload;
    },
    clearCurrentRun: (state) => {
      state.currentRun = {
        summary: null,
        detail: null,
        isLoading: false,
        error: null,
      };
    },
    resetReconciliation: () => initialState,
  },
});

export const {
  setExtractFile,
  setExtractFileData,
  setExtractLoading,
  setExtractError,
  setExtractSheet,
  setExtractHeaderRow,
  setSystemFile,
  setSystemFileData,
  setSystemLoading,
  setSystemError,
  setSystemSheet,
  setSystemHeaderRow,
  setMapping,
  updateExtractMapping,
  updateSystemMapping,
  setWindowDays,
  setCutDate,
  setBankName,
  setExcludeConcepts,
  setCurrentRunSummary,
  setCurrentRunDetail,
  setCurrentRunLoading,
  setCurrentRunError,
  setRuns,
  clearCurrentRun,
  resetReconciliation,
} = reconciliationsSlice.actions;

export default reconciliationsSlice.reducer;
