import React from "react";
import { useParams, Outlet, useNavigate , useLocation} from "react-router-dom";
import { Box, Spinner, Text, Heading, HStack, Clipboard, Button, Tabs } from "@chakra-ui/react";
import { apiFetch } from "../../lib/api"
import { useAuth } from "../../context/AuthContext";
import { useEvent } from "../../context/EventContext";

const EventLayout: React.FC = () => {

  const { token, user } = useAuth();
  const { event, loading, refreshEvent } = useEvent()
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate()
  const location = useLocation()

  const generate_invite = async () => {
      try {
        const res = await apiFetch<ApiResponse<{token:string, url:string}>>(`/api/events/${eventId}/generate-link`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.success) {
          window.location.reload()
        } else {
          console.error("Failed to generate invite link");
        }
      } catch (err) {
        console.error(err);
      } finally {
        console.log('Something went wrong')
      }
    };

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!event) {
    return (
      <Box p={6}>
        <Text>Event not found.</Text>
      </Box>
    );
  }

  // Check if user owns the organizer club
  const isOrganizerOwner = Boolean(
    user?.clubs?.some((club: Club) => club.id === event.organizer_id)
  );

  // Map routes to tabs
  const tabs = [
    { label: "Overview", path: `/dashboard/events/${eventId}` },
    { label: "Schedule", path: `/dashboard/events/${eventId}/schedule` },
    { label: "Standings", path: `/dashboard/events/${eventId}/standings` },
    { label: "Info", path: `/dashboard/events/${eventId}/info` },
  ];

  return (
    <Box p={6}>
      <HStack mb={4} justify={'space-between'}>
        <Heading>{event.name}</Heading>
        {
            isOrganizerOwner ? 
            event.join_links.length !== 0 ?
            <Clipboard.Root value={`/events/invite/${event.join_links[0].token}`}>
                <Clipboard.Trigger asChild>
                <Button variant={'surface'} size='xs'>
                    <Clipboard.Indicator />
                    Invite Link
                </Button>
                </Clipboard.Trigger>
            </Clipboard.Root>
            : <Button variant={'surface'} size='xs' onClick={generate_invite}>
                Generate Invite
                </Button>
            :<></>
        }
        </HStack>
        <Text fontSize="sm" color="gray.600" mb={6}>Date: {event.date}</Text>
        <Tabs.Root 
            defaultValue={location.pathname} 
            variant='enclosed'
            mb={4}
        >
            <Tabs.List>
                {tabs.map((tab) => (
                <Tabs.Trigger
                    key={tab.path}
                    value={tab.path}
                    onClick={() => navigate(tab.path)}
                >
                    {tab.label}
                </Tabs.Trigger>
                ))}
            </Tabs.List>
        </Tabs.Root>
        
        <Outlet context={{ event, isOrganizerOwner, loading, refreshEvent } satisfies EventContext} />
    </Box>
  );
};

export default EventLayout;
