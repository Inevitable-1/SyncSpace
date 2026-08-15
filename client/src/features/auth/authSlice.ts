import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { resetAuthSessionState, getErrorMessage } from '../../services/api';
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
      // Registration no longer signs the user in. Drop any stale persisted
      // session so the unauthenticated sign-up/sign-in flow stays clean.
      localStorage.removeItem('auth');
      return result;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Registration failed'));
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
      return rejectWithValue(getErrorMessage(err, 'Login failed'));
    }
  },
);

export const demoLogin = createAsyncThunk('auth/demoLogin', async (_, { rejectWithValue }) => {
  try {
    const result = await authService.demoLogin();
    localStorage.setItem(
      'auth',
      JSON.stringify({
        state: {
          user: result.user,
          accessToken: result.accessToken,
          isAuthenticated: true,
          isDemo: true,
        },
      }),
    );
    return result;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err, 'Demo login failed'));
  }
});

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const stored = localStorage.getItem('auth');
      if (!stored) return undefined;
      const parsed = JSON.parse(stored);
      const state = parsed?.state;
      if (!state?.user || !state?.accessToken) return undefined;

      // Demo sessions are client-only and never validated against the API.
      if (state.isDemo === true) {
        return {
          user: state.user as User,
          accessToken: state.accessToken as string,
          isDemo: true,
        };
      }

      // Validate the persisted session. On success the freshest user record is
      // returned; on 401 the axios interceptor transparently refreshes the token,
      // and if that fails it emits the session-expired event which logs the user
      // out and redirects to /signin.
      const user = await authService.getMe();
      return { user, accessToken: state.accessToken as string, isDemo: false };
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Session validation failed'));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authService.logout();
    localStorage.removeItem('auth');
  } catch (err: unknown) {
    // Even if the logout request fails (e.g. server unreachable), the local
    // session must still be dropped so the user is not left "authenticated".
    localStorage.removeItem('auth');
    return rejectWithValue(getErrorMessage(err, 'Logout failed'));
  }
});

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (data: ForgotPasswordRequest, { rejectWithValue }) => {
    try {
      await authService.forgotPassword(data);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Failed to send reset email'));
    }
  },
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: ResetPasswordRequest, { rejectWithValue }) => {
    try {
      await authService.resetPassword(data);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, 'Password reset failed'));
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
    resetAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isDemo = false;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.isDemo = false;
        resetAuthSessionState();
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
        resetAuthSessionState();
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(demoLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(demoLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isDemo = true;
        resetAuthSessionState();
      })
      .addCase(demoLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        const session = action.payload;
        if (!session) {
          state.user = null;
          state.accessToken = null;
          state.isAuthenticated = false;
          state.isDemo = false;
          return;
        }
        state.user = session.user;
        state.accessToken = session.accessToken;
        state.isAuthenticated = true;
        state.isDemo = session.isDemo;
        // Persist the freshest user record alongside the existing session. The
        // stored access token may already have been replaced by the axios
        // interceptor during getMe(), so read it back fresh from localStorage.
        try {
          const stored = localStorage.getItem('auth');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.state.user = session.user;
            localStorage.setItem('auth', JSON.stringify(parsed));
            state.accessToken = parsed.state.accessToken ?? null;
          }
        } catch {
          // ignore
        }
        resetAuthSessionState();
      })
      .addCase(initializeAuth.rejected, (state) => {
        // The axios interceptor has already cleared the stored session and
        // emitted the session-expired event when the refresh fails, so this just
        // falls back to the unauthenticated state without spamming an error.
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isDemo = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isDemo = false;
        resetAuthSessionState();
      })
      .addCase(logout.rejected, (state) => {
        // Local session was already cleared by the thunk; make sure the in-memory
        // auth state matches so ProtectedRoute does not keep the user "in".
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isDemo = false;
        resetAuthSessionState();
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

export const { clearError, setUser, resetAuth } = authSlice.actions;
export default authSlice.reducer;
