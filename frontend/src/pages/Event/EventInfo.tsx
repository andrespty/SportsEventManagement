// EventInfo.tsx
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useEvent } from "../../context/EventContext";
import EventManagement from "./EventManagement";
import EventClubParticipantView from "./EventClubParticipantView";

const EventInfo: React.FC = () => {
  const { user } = useAuth();
  const { event } = useEvent();

  if (!event) return null;

  const isOrganizerOwner = user?.clubs?.some((club) => club.id === event.organizer_id);
  const isParticipantOwner = user?.clubs?.some((club) =>
    event.participating_clubs.some((pc) => pc.id === club.id)
  );

  return (
    <>
      {isOrganizerOwner && <EventManagement />}
      {isParticipantOwner && <EventClubParticipantView />}
    </>
  );
};

export default EventInfo;
