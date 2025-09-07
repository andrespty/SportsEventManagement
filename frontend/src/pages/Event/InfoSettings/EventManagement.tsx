import React from "react";
import { Box, Heading, Text, Button, VStack, Card, CardBody } from "@chakra-ui/react";
import { ParticipantsCard } from "../../../components/event/ParticipantsCard";
import EventCategories from "../../../components/event/EventCategories";
import { useEvent } from "../../../context/EventContext";

const EventManagement: React.FC = () => {
  const { event } = useEvent()


  if (!event) {
    return (
      <Box p={6}>
        <Text>Event not found.</Text>
        {/* <Button mt={4} onClick={() => navigate("/dashboard")}>Back to Dashboard</Button> */}
        <Button mt={4} onClick={() =>{}}>Back to Dashboard</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Text fontSize="sm" color="gray.600" mb={6}>Date: {event.date}</Text>

      <VStack gap={4} align="stretch">

        <ParticipantsCard isOrganizer={true} />
  
        <EventCategories isOrganizer={true} />

        <Card.Root>
          <CardBody>
            <Heading size="md">Settings</Heading>
            <Text>Additional settings for the event</Text>
          </CardBody>
        </Card.Root>
      </VStack>
    </Box>
  );
};

export default EventManagement;
