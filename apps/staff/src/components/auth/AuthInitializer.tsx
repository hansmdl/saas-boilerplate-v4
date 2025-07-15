"use client";

import { useEffect } from 'react';
import { useAuthStore } from '../../store/auth';
import { isValidToken } from '../../lib/auth';

export default function AuthInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (accessToken && refreshToken && isValidToken(accessToken)) {
      useAuthStore.getState().setTokens(accessToken, refreshToken);
    }
  }, []);
  return null;
}
