import { AppDispatch } from '@/store';
import {
  setCategories,
  setLoading,
  setError,
  addCategory,
  removeCategory,
  removeRule,
} from '@/store/slices/expensesSlice';
import {
  apiListCategories,
  apiCreateCategory,
  apiDeleteCategory,
  apiCreateRule,
  apiDeleteRule,
} from '@/api';

export const fetchCategoriesThunk = (token: string) =>
  async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const categories = await apiListCategories(token);
      dispatch(setCategories(categories));
    } catch (error: any) {
      const message = error.message || 'Error al cargar categorías';
      dispatch(setError(message));
      throw error;
    }
  };

export const createCategoryThunk = (token: string, name: string) =>
  async (dispatch: AppDispatch) => {
    try {
      const category = await apiCreateCategory(token, name);
      dispatch(addCategory(category));
    } catch (error: any) {
      console.error('Error al crear categoría:', error);
      throw error;
    }
  };

export const deleteCategoryThunk = (token: string, id: string) =>
  async (dispatch: AppDispatch) => {
    try {
      await apiDeleteCategory(token, id);
      dispatch(removeCategory(id));
    } catch (error: any) {
      console.error('Error al eliminar categoría:', error);
      throw error;
    }
  };

export const createRuleThunk = (token: string, data: {
  categoryId: string;
  pattern: string;
  isRegex: boolean;
  caseSensitive: boolean;
}) =>
  async (dispatch: AppDispatch) => {
    try {
      await apiCreateRule(token, data);
      await dispatch(fetchCategoriesThunk(token));
    } catch (error: any) {
      console.error('Error al crear regla:', error);
      throw error;
    }
  };

export const deleteRuleThunk = (token: string, id: string) =>
  async (dispatch: AppDispatch) => {
    try {
      await apiDeleteRule(token, id);
      dispatch(removeRule(id));
    } catch (error: any) {
      console.error('Error al eliminar regla:', error);
      throw error;
    }
  };
