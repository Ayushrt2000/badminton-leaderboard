// Hand-written types matching the Supabase schema (public schema).
// Regenerate with the Supabase CLI (`supabase gen types typescript`) if the schema changes.

export type Community = {
  id: string;
  name: string;
  created_at: string;
};

export type Profile = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  community_id: string | null;
  created_at: string;
};

export type SkillGroup = "beginner" | "advanced";

export type EventStatus = "lobby" | "in_progress" | "finals" | "completed";

export type Event = {
  id: string;
  name: string;
  event_date: string;
  host_id: string;
  community_id: string | null;
  created_at: string;
  max_participants: number;
  session_minutes: number;
  game_minutes: number;
  round_minutes: number;
  status: EventStatus;
};

export type Court = {
  id: string;
  community_id: string;
  name: string;
  created_at: string;
};

export type EventParticipant = {
  id: string;
  event_id: string;
  profile_id: string;
  skill_group: SkillGroup;
  joined_at: string;
};

export type EventCourt = {
  id: string;
  event_id: string;
  court_id: string;
  skill_group: SkillGroup;
};

export type Round = {
  id: string;
  event_id: string;
  skill_group: SkillGroup;
  round_number: number;
  is_final: boolean;
  created_at: string;
};

export type RoundMatch = {
  id: string;
  round_id: string;
  court_id: string | null;
  team1_player1_id: string;
  team1_player2_id: string;
  team2_player1_id: string;
  team2_player2_id: string;
  team1_score: number | null;
  team2_score: number | null;
  created_at: string;
};

export type GroupLeaderboardRow = {
  event_id: string;
  skill_group: SkillGroup;
  player_id: string;
  player_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  point_diff: number;
};

export type Match = {
  id: string;
  event_id: string;
  player1_id: string;
  player2_id: string;
  player1_score: number;
  player2_score: number;
  winner_id: string;
  logged_by: string | null;
  created_at: string;
};

export type LeaderboardRow = {
  event_id: string;
  player_id: string;
  player_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  points: number;
  points_for: number;
  points_against: number;
  point_diff: number;
};

