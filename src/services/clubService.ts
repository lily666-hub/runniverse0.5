import { demoClubs } from '../data/clubs';
import type { Club, ClubComment, ClubQueryOptions, ClubActionResponse } from '../types/club';
import { isSupabaseAvailable, supabase } from '../lib/supabase';

const LOCAL_KEY = 'club_state_v1';

interface LocalState {
  likes: Record<string, number>;
  joined: Record<string, boolean>;
  comments: ClubComment[];
}

const getLocalState = (): LocalState => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { likes: {}, joined: {}, comments: [] };
};

const setLocalState = (state: LocalState) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch {}
};

export const clubService = {
  async getRecommendedClubs(options: ClubQueryOptions = {}): Promise<Club[]> {
    let clubs = [...demoClubs];

    if (options.personalized) {
      clubs = clubs.sort((a, b) => (b.heatScore || 0) - (a.heatScore || 0));
    }

    switch (options.sortBy) {
      case 'heat':
        clubs.sort((a, b) => (b.heatScore || 0) - (a.heatScore || 0));
        break;
      case 'distance':
        clubs.sort((a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity));
        break;
      case 'activityTime':
        clubs.sort((a, b) => {
          const ta = a.latestActivity ? new Date(a.latestActivity.time).getTime() : 0;
          const tb = b.latestActivity ? new Date(b.latestActivity.time).getTime() : 0;
          return ta - tb;
        });
        break;
      default:
        break;
    }

    if (options.limit) clubs = clubs.slice(0, options.limit);
    return clubs;
  },

  async likeClub(clubId: string): Promise<ClubActionResponse> {
    const state = getLocalState();
    state.likes[clubId] = (state.likes[clubId] || 0) ? 0 : 1;
    setLocalState(state);
    return { success: true };
  },

  async joinClub(clubId: string): Promise<ClubActionResponse> {
    const state = getLocalState();
    state.joined[clubId] = true;
    setLocalState(state);
    return { success: true };
  },

  async leaveClub(clubId: string): Promise<ClubActionResponse> {
    const state = getLocalState();
    state.joined[clubId] = false;
    setLocalState(state);
    return { success: true };
  },

  async addComment(comment: Omit<ClubComment, 'id' | 'createdAt'>): Promise<ClubActionResponse> {
    const state = getLocalState();
    state.comments.push({
      id: Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
      ...comment,
    });
    setLocalState(state);
    return { success: true };
  },

  async getComments(clubId: string): Promise<ClubComment[]> {
    const state = getLocalState();
    return state.comments.filter(c => c.clubId === clubId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getClubById(id: string): Promise<Club | null> {
    const club = demoClubs.find(c => c.id === id) || null;
    return club;
  }
};