import { AppDispatch } from '@/store';
import { setCredentials, setLoading, setError, logout } from '@/store/slices/authSlice';
import { apiLogin, apiMe } from '@/api';

export const loginThunk = (email: string, password: string) => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  
  try {
    const response = await apiLogin(email, password);
    dispatch(setCredentials({
      token: response.accessToken,
      user: response.user,
    }));
  } catch (error: any) {
    const message = error.message || 'Error al iniciar sesión';
    dispatch(setError(message));
    throw error;
  }
};

export const restoreUserThunk = (token: string) => async (dispatch: AppDispatch) => {
  try {
    const user = await apiMe(token);
    dispatch(setCredentials({ token, user }));
  } catch {
    dispatch(logout());
  }
};
