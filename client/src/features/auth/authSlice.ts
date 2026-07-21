import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import type {
  AuthState,
  User,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../../types';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isDemo: false,
};

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const result = await authService.register(data);
      localStorage.setItem(
        'auth',
        JSON.stringify({
          state: { user: result.user, accessToken: result.accessToken, isAuthenticated: true },
        }),
      );
      return result;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  },
);

export const login = createAsyncThunk(
  'auth/login',
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const result = await authService.login(data);
      localStorage.setItem(
        'auth',
        JSON.stringify({
          state: { user: result.user, accessToken: result.accessToken, isAuthenticated: true },
        }),
      );
      return result;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authService.logout();
    localStorage.removeItem('auth');
  } catch (err: unknown) {
    localStorage.removeItem('auth');
    const error = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(error.response?.data?.message || 'Logout failed');
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const result = await authService.getMe();
    return result;
  } catch (err: unknown) {
    localStorage.removeItem('auth');
    const error = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
  }
});

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (data: ForgotPasswordRequest, { rejectWithValue }) => {
    try {
      await authService.forgotPassword(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to send reset email');
    }
  },
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: ResetPasswordRequest, { rejectWithValue }) => {
    try {
      await authService.resetPassword(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Password reset failed');
    }
  },
);

function loadInitialAuth(): {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isDemo: boolean;
} {
  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.user && parsed?.state?.accessToken) {
        return {
          user: parsed.state.user,
          accessToken: parsed.state.accessToken,
          isAuthenticated: true,
          isDemo: parsed.state.isDemo ?? false,
        };
      }
    }
  } catch {
    localStorage.removeItem('auth');
  }
  return { user: null, accessToken: null, isAuthenticated: false, isDemo: false };
}

const savedAuth = loadInitialAuth();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    ...initialState,
    user: savedAuth.user,
    accessToken: savedAuth.accessToken,
    isAuthenticated: savedAuth.isAuthenticated,
    isDemo: savedAuth.isDemo,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    demoLogin(state) {
      state.user = {
        id: 'demo-user-001',
        name: 'Alex Johnson',
        email: 'alex@syncspace.demo',
        avatar: '',
        isEmailVerified: true,
      };
      state.accessToken = 'demo-token';
      state.isAuthenticated = true;
      state.isDemo = true;
      state.error = null;
      localStorage.setItem(
        'auth',
        JSON.stringify({
          state: {
            user: state.user,
            accessToken: state.accessToken,
            isAuthenticated: true,
            isDemo: true,
          },
        }),
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isDemo = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isDemo = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isDemo = false;
      })
      .addCase(fetchMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setUser, demoLogin } = authSlice.actions;
export default authSlice.reducer;
