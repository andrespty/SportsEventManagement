// Context types for React Router Outlet

declare global {
  type EventContext = {
    event: EventModel;
    isOrganizerOwner: boolean;
    loading: boolean;
    refreshEvent: () => void;
  };
}

export {};