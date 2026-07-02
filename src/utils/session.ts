import { User } from '../types';

const SESSION_KEY = 'church_session';

export function saveSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
