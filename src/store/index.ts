import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import reconciliationsReducer from './slices/reconciliationsSlice';
import expensesReducer from './slices/expensesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reconciliations: reconciliationsReducer,
    expenses: expensesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'reconciliations/setExtractFile',
          'reconciliations/setSystemFile',
        ],
        ignoredPaths: ['reconciliations.extract.file', 'reconciliations.system.file'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
