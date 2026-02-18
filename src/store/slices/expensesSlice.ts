import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ExpenseCategory } from '@/types';

interface ExpensesState {
  categories: ExpenseCategory[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ExpensesState = {
  categories: [],
  isLoading: false,
  error: null,
};

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setCategories: (state, action: PayloadAction<ExpenseCategory[]>) => {
      state.categories = (action.payload ?? []).map((cat) => ({
        ...cat,
        rules: cat.rules ?? [],
      }));
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    addCategory: (state, action: PayloadAction<ExpenseCategory>) => {
      const cat = action.payload;
      state.categories.push({
        ...cat,
        rules: cat.rules ?? [],
      });
    },
    removeCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(cat => cat.id !== action.payload);
    },
    addRule: (state, action: PayloadAction<{ categoryId: string; rule: ExpenseCategory['rules'][0] }>) => {
      const category = state.categories.find(cat => cat.id === action.payload.categoryId);
      if (category) {
        if (!category.rules) category.rules = [];
        category.rules.push(action.payload.rule);
      }
    },
    removeRule: (state, action: PayloadAction<string>) => {
      for (const category of state.categories) {
        category.rules = (category.rules ?? []).filter(rule => rule.id !== action.payload);
      }
    },
  },
});

export const {
  setCategories,
  setLoading,
  setError,
  addCategory,
  removeCategory,
  addRule,
  removeRule,
} = expensesSlice.actions;

export default expensesSlice.reducer;
