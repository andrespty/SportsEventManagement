export type EventJoinRequestsAPI = {
    event_id: number;
    event_name: string;
    join_requests: JoinRequest[]
}

export type JoinRequest = {
    club_id: number;
    id: number;
    status: string;
    event_id: number;
    club: Club
}