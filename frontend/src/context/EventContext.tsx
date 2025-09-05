// context/EventsContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Event } from "../types/models";
import { apiFetch } from "../lib/api";
import { ApiResponse } from "../types/common";
import { useAuth } from "./AuthContext";

interface EventContextType {
  event: Event | null;
  loading: boolean;
  refreshEvent: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const { eventId } = useParams<{ eventId: string }>();

  const { token, user } = useAuth();

    const refreshEvent = useCallback(async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        const res = await apiFetch<ApiResponse<Event>>(`/api/events/${eventId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (res.success) {
          setEvent(res.data);
        } else {
          console.error("Failed to fetch event");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, [eventId, token])
    
  
    useEffect(() => {
      refreshEvent();
    }, [eventId, token, refreshEvent]);

  return (
    <EventContext.Provider value={{ event, refreshEvent, loading }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error("useEvents must be used within EventsProvider");
  return context;
};
