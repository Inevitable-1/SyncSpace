import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useToast } from './common/Toast';
import { resetAuth } from '../features/auth/authSlice';
import { SESSION_EXPIRED_EVENT, SESSION_EXPIRED_MESSAGE } from '../services/session';
import type { RootState, AppDispatch } from '../store';

export default function SessionExpiredListener() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const handledRef = useRef(false);

  // A burst of parallel requests can all hit an expired session. Only the first
  // one should show the toast and redirect; re-arm the guard once a fresh
  // session is established (login / demo login).
  useEffect(() => {
    if (isAuthenticated) {
      handledRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handle = () => {
      if (handledRef.current) return;
      handledRef.current = true;
      dispatch(resetAuth());
      showToast(SESSION_EXPIRED_MESSAGE, 'error');
      navigate('/signin', { replace: true });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handle);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handle);
  }, [dispatch, navigate, showToast]);

  return null;
}
