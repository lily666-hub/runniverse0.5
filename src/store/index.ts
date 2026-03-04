import { create } from 'zustand';
import { User, Run, Route, Challenge } from '../types';

// 用户状态管理
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: (user) => set({ user }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// 跑步状态管理
interface RunState {
  currentRun: Run | null;
  isRunning: boolean;
  isPaused: boolean;
  runs: Run[];
  setCurrentRun: (run: Run | null) => void;
  setRunning: (running: boolean) => void;
  setPaused: (paused: boolean) => void;
  addRun: (run: Run) => void;
  setRuns: (runs: Run[]) => void;
}

export const useRunStore = create<RunState>((set) => ({
  currentRun: null,
  isRunning: false,
  isPaused: false,
  runs: [],
  setCurrentRun: (run) => set({ currentRun: run }),
  setRunning: (running) => set({ isRunning: running }),
  setPaused: (paused) => set({ isPaused: paused }),
  addRun: (run) => set((state) => ({ runs: [...state.runs, run] })),
  setRuns: (runs) => set({ runs }),
}));

// 路线状态管理
interface RouteState {
  routes: Route[];
  selectedRoute: Route | null;
  setRoutes: (routes: Route[]) => void;
  setSelectedRoute: (route: Route | null) => void;
  addRoute: (route: Route) => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  routes: [],
  selectedRoute: null,
  setRoutes: (routes) => set({ routes }),
  setSelectedRoute: (route) => set({ selectedRoute: route }),
  addRoute: (route) => set((state) => ({ routes: [...state.routes, route] })),
}));

// 挑战状态管理
interface ChallengeState {
  challenges: Challenge[];
  activeChallenges: Challenge[];
  setChallenges: (challenges: Challenge[]) => void;
  setActiveChallenges: (challenges: Challenge[]) => void;
  addChallenge: (challenge: Challenge) => void;
}

export const useChallengeStore = create<ChallengeState>((set) => ({
  challenges: [],
  activeChallenges: [],
  setChallenges: (challenges) => set({ challenges }),
  setActiveChallenges: (challenges) => set({ activeChallenges: challenges }),
  addChallenge: (challenge) => set((state) => ({ challenges: [...state.challenges, challenge] })),
}));

// 应用全局状态管理
interface AppState {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  error: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));