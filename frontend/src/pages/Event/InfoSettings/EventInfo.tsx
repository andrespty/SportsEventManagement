// EventInfo.tsx
import React from "react";
import { useAuth } from "../../../context/AuthContext";
import EventManagement from "./EventManagement";
import EventClubParticipantView from "../EventClubParticipantView";
import { useOutletContext } from "react-router-dom";

const EventInfo: React.FC = () => {
  const { user } = useAuth();
  const { event, isOrganizerOwner } = useOutletContext<EventContext>();

  if (!event) return null;

  const isParticipantOwner = user?.clubs?.some((club:Club) =>
    event.participating_clubs.some((pc:Club) => pc.id === club.id)
  );

  return (
    <>
      {isOrganizerOwner && <EventManagement />}
      {isParticipantOwner && <EventClubParticipantView />}
    </>
  );
};

export default EventInfo;
