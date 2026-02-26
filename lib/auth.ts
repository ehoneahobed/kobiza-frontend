import { apiFetch } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'CREATOR' | 'MEMBER';
  avatarUrl: string | null;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  role?: 'CREATOR' | 'MEMBER';
}): Promise<AuthResult> {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe(): Promise<AuthUser> {
  return apiFetch('/auth/me');
}

export async function forgotPassword(email: string) {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string) {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function updateMe(data: { name?: string; avatarUrl?: string }): Promise<AuthUser> {
  return apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify(data) });
}

export function saveToken(token: string) {
  localStorage.setItem('paidli_token', token);
}

export function clearToken() {
  localStorage.removeItem('paidli_token');
}

export function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('paidli_token') : null;
}
