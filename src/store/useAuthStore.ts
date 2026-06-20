import { create } from 'zustand';
import type { User, UserRole } from '../types';
import usersData from '../data/users.json';
import { loadFromStorage, saveToStorage } from '../utils/storage';

interface AuthState {
  currentUser: User | null;
  loginAsUser: (userId: string) => void;
  loginByRole: (role: UserRole) => void;
  logout: () => void;
  getUsersByRole: (role: UserRole) => User[];
}

const STORAGE_KEY = 'auth';

export const useAuthStore = create<AuthState>((set) => {
  const savedUser = loadFromStorage<User | null>(STORAGE_KEY, null);
  
  return {
    currentUser: savedUser,
    
    loginAsUser: (userId: string) => {
      const user = usersData.find(u => u.id === userId) as User | undefined;
      if (user) {
        set({ currentUser: user });
        saveToStorage(STORAGE_KEY, user);
      }
    },
    
    loginByRole: (role: UserRole) => {
      const user = usersData.find(u => u.role === role) as User | undefined;
      if (user) {
        set({ currentUser: user });
        saveToStorage(STORAGE_KEY, user);
      }
    },
    
    logout: () => {
      set({ currentUser: null });
      saveToStorage(STORAGE_KEY, null);
    },
    
    getUsersByRole: (role: UserRole) => {
      return usersData.filter(u => u.role === role) as User[];
    },
  };
});
