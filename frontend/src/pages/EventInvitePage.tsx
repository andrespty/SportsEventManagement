import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Card, CardBody, Heading, Text, Spinner, Checkbox, CheckboxGroup, Stack } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { useToastContext } from "../context/ToastContext";

interface EventInvite {
    event_id: number;
    event_name: string;
    clubs: [{id:number, name:string}]
}
interface JoinRequestSuccess{
    message: string
}

const EventInvitePage: React.FC = () => {
  const { event_token } = useParams<{ event_token: string }>();
  const { user, token } = useAuth() 
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventInvite | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [requested, setRequested] = useState<boolean>(false);
  const [selectedClubs, setSelectedClubs] = useState<number[]>([]);
  const { createToast } = useToastContext()

  useEffect(() => {
    if (!event_token || !token) return;
    // if (!token) {
    //   navigate("/login");
    //   return;
    // }
    const fetchEvent = async () => {
      try {
        const res = await apiFetch<ApiResponse<EventInvite>>(`/api/events/join/${event_token}`,{
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (res.success){
            console.log(res.data)
            if (!user?.clubs || user?.clubs.length === 0) {
            //   navigate("/not-authorized");
              return;
            }
            setEvent(res.data);
        } 
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [event_token, user, navigate, token]);

  const handleRequestJoin = async () => {
    if (!event) return;
    if (selectedClubs.length === 0) return;
    try {
      const res = await apiFetch<ApiResponse<JoinRequestSuccess>>(`/api/events/${event.event_id}/request-join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ club_ids: selectedClubs})
      });
      if (res.success){
            // setRequested(true);
            createToast({title:"Join Request", description:"Sent!", type:"success"});
            navigate("/dashboard");
      }
      else{
        console.log(res)
        createToast({
          title: 'Error',
          description: res.error.message,
          type: 'error'
        })
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Spinner size="xl" />;

  if (requested) return <Text>Request sent! Waiting for approval.</Text>;

  return (
    <Box maxW="md" mx="auto" mt={10}>
      <Card.Root>
        <CardBody>
          <Heading size="md">{event?.event_name}</Heading>
          <Text>Select your clubs to join this event:</Text>

          <CheckboxGroup
            value={selectedClubs.map(String)}
            onValueChange={(values: string[]) => setSelectedClubs(values.map(Number))}
          >
            <Stack mt={4} gap={2}>
              {event?.clubs.map((club) => (
                <Checkbox.Root key={club.id} value={club.id.toString()}>
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  <Checkbox.Label>{club.name}</Checkbox.Label>
                </Checkbox.Root>
              ))}
            </Stack>
          </CheckboxGroup>
          <Button colorScheme="blue" mt={4} onClick={handleRequestJoin}>
            Request to Join
          </Button>
        </CardBody>
      </Card.Root>
    </Box>
  );
};

export default EventInvitePage;
