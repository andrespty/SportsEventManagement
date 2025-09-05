import { UserRoles } from "./auth";

export type Club = {
  id: number;
  name: string;
  owner_id: number;
};

export type User = {
  id: number;
  email: string;
  role: UserRoles;
  created_at: string; // ISO date string
  isOwner: boolean;
  clubs: Club[];
};

export type MatchParticipant ={
  id: number,
  match_id: number,
  participant_id: number,
  role: string,
  position: string,
  score: number,
  rank: number,
  result_type: string
  participant: EventParticipantSimple
}

export type Match = {
  id: number,
  category_id: number,
  round: number,
  match_number: number,
  status: string,
  participants:MatchParticipant[]
}

export type CategoryFull = {
  id: number;
  order: number;
  name: string;
  event_id: number;
  can_sign_up: boolean;
  is_bracket: boolean;
  matches: Match[];
}
export type CategorySimple = {
  id: number;
  name: string;
  event_id: number;
}

export type CategoryWithSeed = CategorySimple & {
  seed: number
}

export type Event = {
  id: number;
  name: string;
  organizer: Club;
  organizer_id: number;
  participants: EventParticipant[];
  participating_clubs: Club[];
  categories: CategoryFull[];
  date: string;
  join_links: EventJoinLink[]
}

export type EventJoinLink = {
  event_id: number;
  id: number;
  token: string
}

export type ParticipantCategory = {
  seed: number;
  category: CategorySimple
}

export type EventParticipant = {
  id: number,
  name: string,
  event_id: number,
  club: Club,
  club_id: number,
  categories: CategoryWithSeed[]
}

export type EventParticipantSimple = {
  id: number,
  name: string,
  event_id: number,
  club_id: number
}
