import React from "react";
import { Box, Heading, Text, VStack, Card, CardBody } from "@chakra-ui/react";
import { ParticipantsCard } from "../../components/event/ParticipantsCard";
import EventCategories from "../../components/event/EventCategories";
import { useEvent } from "../../context/EventContext";

const EventClubParticipantView: React.FC = () => {

  const { event } = useEvent()

  return (
    <Box>
      <VStack gap={4} align="stretch">
        {/* Participants list */}
        <ParticipantsCard isOrganizer={false} />

        {/* Event categories (display only for participant owners) */}
        <EventCategories isOrganizer={false} />

        {/* Optional card for participant-only info */}
        <Card.Root>
          <CardBody>
            <Heading size="md">Participation Info</Heading>
            <Text>
              Your club is participating in this event. Some settings may only
              be managed by the event organizer.
            </Text>
          </CardBody>
        </Card.Root>
      </VStack>
    </Box>
  );
};

export default EventClubParticipantView;
