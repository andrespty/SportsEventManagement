// Global type declarations for models
// These types are automatically available throughout the app
declare global {
  type Club = {
    id: number;
    name: string;
    owner_id: number;
  };

  type User = {
    id: number;
    email: string;
    role: UserRoles;
    created_at: string; // ISO date string
    isOwner: boolean;
    clubs: Club[];
  };

  type MatchParticipant = {
    id: number;
    match_id: number;
    participant_id: number;
    role: string;
    position: string;
    score: number | null;
    rank: number | null;
    result_type: string | null;
    participant: EventParticipantSimple;
  };

  type Match = {
    id: number;
    category_id: number;
    round: number;
    match_number: number;
    status: string;
    participants: MatchParticipant[];
    start_time: string | null; // ISO date string or null
  };

  type CategoryFull = {
    id: number;
    order: number;
    name: string;
    event_id: number;
    can_sign_up: boolean;
    is_bracket: boolean;
    matches: Match[];
  };

  type CategorySimple = {
    id: number;
    name: string;
    event_id: number;
  };

  type CategoryWithSeed = CategorySimple & {
    seed: number;
  };

  type EventModel = {
    id: number;
    name: string;
    organizer: Club;
    organizer_id: number;
    participants: EventParticipant[];
    participating_clubs: Club[];
    categories: CategoryFull[];
    date: string;
    join_links: EventJoinLink[];
  };

  type EventJoinLink = {
    event_id: number;
    id: number;
    token: string;
  };

  type ParticipantCategory = {
    seed: number;
    category: CategorySimple;
  };

  type EventParticipant = {
    id: number;
    name: string;
    event_id: number;
    club: Club;
    club_id: number;
    categories: CategoryWithSeed[];
  };

  type EventParticipantSimple = {
    id: number;
    name: string;
    event_id: number;
    club_id: number;
  };
}

// This export is required for the global declaration to work
export {};
