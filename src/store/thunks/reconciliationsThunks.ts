import { AppDispatch, RootState } from '@/store';
import {
  setExtractFileData,
  setExtractLoading,
  setExtractError,
  setSystemFileData,
  setSystemLoading,
  setSystemError,
  setCurrentRunSummary,
  setCurrentRunDetail,
  setCurrentRunLoading,
  setCurrentRunError,
  setRuns,
} from '@/store/slices/reconciliationsSlice';
import {
  apiParseFile,
  apiRunReconciliation,
  apiGetRun,
  apiListRuns,
  apiExportRun,
  apiShareRun,
  apiAddMessage,
} from '@/api';

export const parseExtractFileThunk = (token: string, file: File, sheetName: string, headerRow: number) =>
  async (dispatch: AppDispatch) => {
    dispatch(setExtractLoading(true));
    dispatch(setExtractError(null));

    try {
      const result = await apiParseFile(token, file, sheetName, headerRow);
      dispatch(setExtractFileData({
        sheets: result.sheets,
        rows: result.rows,
        selectedSheet: sheetName || result.sheets[0] || '',
      }));
    } catch (error: any) {
      const message = error.message || 'No se pudo leer el archivo';
      dispatch(setExtractError(message));
      throw error;
    }
  };

export const parseSystemFileThunk = (token: string, file: File, sheetName: string, headerRow: number) =>
  async (dispatch: AppDispatch) => {
    dispatch(setSystemLoading(true));
    dispatch(setSystemError(null));

    try {
      const result = await apiParseFile(token, file, sheetName, headerRow);
      dispatch(setSystemFileData({
        sheets: result.sheets,
        rows: result.rows,
        selectedSheet: sheetName || result.sheets[0] || '',
      }));
    } catch (error: any) {
      const message = error.message || 'No se pudo leer el archivo';
      dispatch(setSystemError(message));
      throw error;
    }
  };

export const runReconciliationThunk = (token: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(setCurrentRunLoading(true));
    dispatch(setCurrentRunError(null));

    const { reconciliations } = getState();
    const { extract, system, mapping, windowDays, cutDate, excludeConcepts } = reconciliations;

    try {
      const summary = await apiRunReconciliation(token, {
        title: `Conciliación ${new Date().toLocaleDateString()}`,
        windowDays,
        cutDate: cutDate || undefined,
        extract: {
          rows: extract.rows,
          mapping: mapping.extract,
          excludeConcepts: excludeConcepts.length ? excludeConcepts : undefined,
        },
        system: {
          rows: system.rows,
          mapping: mapping.system,
        },
      });

      dispatch(setCurrentRunSummary(summary));

      const detail = await apiGetRun(token, summary.runId);
      dispatch(setCurrentRunDetail(detail));
    } catch (error: any) {
      const message = error.message || 'Error al conciliar';
      dispatch(setCurrentRunError(message));
      throw error;
    }
  };

export const fetchRunDetailThunk = (token: string, runId: string) =>
  async (dispatch: AppDispatch) => {
    dispatch(setCurrentRunLoading(true));
    dispatch(setCurrentRunError(null));

    try {
      const detail = await apiGetRun(token, runId);
      dispatch(setCurrentRunDetail(detail));
      dispatch(setCurrentRunLoading(false));
    } catch (error: any) {
      const message = error.message || 'Error al cargar la conciliación';
      dispatch(setCurrentRunError(message));
      throw error;
    }
  };

export const fetchRunsThunk = (token: string) =>
  async (dispatch: AppDispatch) => {
    try {
      const runs = await apiListRuns(token);
      dispatch(setRuns(runs));
    } catch (error: any) {
      console.error('Error al cargar conciliaciones:', error);
      throw error;
    }
  };

export const exportRunThunk = (token: string, runId: string) =>
  async () => {
    const blob = await apiExportRun(token, runId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conciliacion_${runId}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

export const shareRunThunk = (token: string, runId: string, email: string, role: 'OWNER' | 'EDITOR' | 'VIEWER') =>
  async (dispatch: AppDispatch) => {
    await apiShareRun(token, runId, email, role);
    const detail = await apiGetRun(token, runId);
    dispatch(setCurrentRunDetail(detail));
  };

export const addMessageThunk = (token: string, runId: string, body: string) =>
  async (dispatch: AppDispatch) => {
    await apiAddMessage(token, runId, body);
    const detail = await apiGetRun(token, runId);
    dispatch(setCurrentRunDetail(detail));
  };
