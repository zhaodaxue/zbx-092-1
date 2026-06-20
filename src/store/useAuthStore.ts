import { create } from 'zustand';
import type { User, UserRole } from '../types';
import usersData from '../data/users.json';
import { loadFromStorage, saveToStorage } from '../utils/storage';

interface AuthState {
  currentUser: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
}

const STORAGE_KEY = 'auth';

export const useAuthStore = create<AuthState>((set) => {
  const savedUser = loadFromStorage<User | null>(STORAGE_KEY, null);
  
  return {
    currentUser: savedUser,
    login: (role: UserRole) => {
      const user = usersData.find(u => u.role === role) as User;
      if (user) {
        set({ currentUser: user });
        saveToStorage(STORAGE_KEY, user);
      }
    },
    logout: () => {
      set({ currentUser: null });
      saveToStorage(STORAGE_KEY, null);
    },
  };
});
