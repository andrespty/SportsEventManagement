// context/EventsContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "./AuthContext";

interface EventsContextType {
  events: EventModel[];
  setEvents: React.Dispatch<React.SetStateAction<EventModel[]>>;
  loading: boolean;
  participatingEvents: EventModel[];
  loadingParticipating: boolean;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<EventModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [participatingEvents, setParticipatingEvents] = useState<EventModel[]>([]);
  const [loadingParticipating, setLoadingParticipating] = useState(true);

  const { token } = useAuth();

  useEffect(() => {
    const fetchParticipating = async () => {
      setLoadingParticipating(true);
      try {
        const res = await apiFetch<ApiResponse<EventModel[]>>(
          `/api/events/participating`,
          { 
            method: "GET", 
            headers: { Authorization: `Bearer ${token}` } 
          }
        );
        if (res.success) {
          setParticipatingEvents(res.data)
          setLoadingParticipating(false)
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingParticipating(false);
      }
    };
    const fetchMyEvents = async () => {
      try {
        const res = await apiFetch<ApiResponse<EventModel[]>>(`/api/events/`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.success) setEvents(res.data);
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        setLoading(false);
      }
    };
    if (token){
      fetchParticipating()
      fetchMyEvents();
    }
  }, [token]);

  return (
    <EventsContext.Provider value={{ events, setEvents, loading, loadingParticipating, participatingEvents }}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) throw new Error("useEvents must be used within EventsProvider");
  return context;
};
