import { UserProfile, Reading } from '../types';

const PROFILE_KEY = 'oraculo7_profile';
const HISTORY_KEY = 'oraculo7_history';

export const saveProfile = (profile: UserProfile): void => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getProfile = (): UserProfile | null => {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveReading = (reading: Reading): void => {
  const history = getHistory();
  const updated = [reading, ...history];
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

export const updateReading = (updatedReading: Reading): void => {
  const history = getHistory();
  const updated = history.map(r => r.id === updatedReading.id ? updatedReading : r);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

export const getHistory = (): Reading[] => {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearData = (): void => {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(HISTORY_KEY);
};