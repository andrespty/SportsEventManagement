import React, { useEffect, useState } from "react";
import { Box, Heading, VStack, Card, CardBody, Spinner, Text, Tabs } from "@chakra-ui/react";
import { apiFetch } from "../../lib/api";
import { ApiResponse } from "../../types/common";
import { useAuth } from "../../context/AuthContext";
import ClubList from "./ClubList";
import ParticipantList from "./ParticipantList";
import RequestList from "./RequestList";
import { EventJoinRequestsAPI, JoinRequest } from "../../types/enpoints";
import { Club } from "../../types/models";
import MyParticipants from "./MyParticipants";
import { useEvent } from "../../context/EventContext";

interface ParticipantsCardProps {
  isOrganizer: boolean
}

export const ParticipantsCard: React.FC<ParticipantsCardProps> = ({ isOrganizer }) => {
  const { event } = useEvent()
  const { token, user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>(event?.participating_clubs || []);
  const [participants, setParticipants] = useState<any[]>(event?.participants || []);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);

 
  useEffect(() => {
    console.log(event)
    const fetchData = async () => {
      setLoading(true);
      try {
        const requestsRes = await apiFetch<ApiResponse<EventJoinRequestsAPI>>(`/api/events/${event?.id}/join-requests`, {
            headers: { Authorization: `Bearer ${token}` },
            method: "GET"
          })
        if (requestsRes.success) setRequests(requestsRes.data.join_requests);
      } catch (err) {
        console.error("Failed to fetch participants data", err);
      } finally {
        setLoading(false);
      }
    };
    if (isOrganizer) fetchData();
  }, [event, token, isOrganizer]);

  if (loading) {
    return (
      <Card.Root>
        <CardBody textAlign="center">
          <Spinner size="lg" />
        </CardBody>
      </Card.Root>
    );
  }

  return (
    <Card.Root>
      <Card.Body>
    <Tabs.Root defaultValue={'myParticipants'}>
      <Tabs.List>
        <Tabs.Trigger value='myParticipants'>My Club</Tabs.Trigger>
        <Tabs.Trigger value='participants'>Participants</Tabs.Trigger>
        <Tabs.Trigger value='clubs'>Clubs</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value='myParticipants'>
        <MyParticipants />
      </Tabs.Content>
      <Tabs.Content value='participants'>
        <Box>
          <Heading size="sm" mb={2}>Event Participants</Heading>
          {
            participants.length > 0 
            ? <ParticipantList participants={participants} /> 
            : <Text>No participants yet.</Text>
          }
        </Box>
      </Tabs.Content>
      <Tabs.Content value='clubs'>
        <VStack align="stretch" gap={6}>
          <Box>
            <Heading size="sm" mb={2}>Participating Clubs</Heading>
            {
              clubs.length > 0 
              ? <ClubList clubs={clubs} /> 
              : <Text>No clubs joined yet.</Text>
            }
          </Box>
          {
            isOrganizer &&
            <Box>
              <Heading size="sm" mb={2}>Join Requests</Heading>
              {requests.length > 0 ? <RequestList requests={requests} /> : <Text>No pending requests.</Text>}
            </Box>
          }
        </VStack>
      </Tabs.Content>
    </Tabs.Root>
    </Card.Body>
    </Card.Root>
  );
};
