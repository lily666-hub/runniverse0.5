import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// 生成一个有效的UUID格式的演示用户ID
const generateDemoUserId = () => {
  return '550e8400-e29b-41d4-a716-446655440000'; // 固定的演示UUID
};

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: generateDemoUserId(),
    name: '演示用户',
    email: 'demo@example.com'
  },
  isAuthenticated: true,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));