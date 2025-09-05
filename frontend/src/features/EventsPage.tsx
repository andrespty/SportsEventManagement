import { useState } from "react";
import { Box, Heading, Button, Input, SimpleGrid, Text, VStack, Card, CardBody, CloseButton, Dialog, Portal, Select as ChakraSelect, createListCollection, Field } from "@chakra-ui/react";
import { apiFetch } from "../lib/api";
import { Event } from "../types/models";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../context/EventsContext";
import { useNavigate } from "react-router-dom";

interface NewEvent {
  name: string;
  date: string;
  organizer_id: number;
}

export default function EventsPage() {
  const { events, setEvents, loading, participatingEvents, loadingParticipating } = useEvents();
  const { token, user } = useAuth();
  const [newEvent, setNewEvent] = useState<NewEvent>({ name: "", date: "", organizer_id: 0 });
  const [open, setOpen] = useState(false);

  const navigate = useNavigate()

  const clubsCollection = createListCollection({
    items: user?.clubs?.map((club: { id: number; name: string }) => ({ label: club.name, value: club.id })) || [],
  });

  const handleCreateEvent = async () => {
    if (!newEvent.organizer_id) return; // simple validation
    try {
      const res = await apiFetch<{ success: boolean; data: Event }>(`/api/events/${newEvent.organizer_id}/create`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newEvent.name, date: newEvent.date }),
      });
      if (res.success) {
        setEvents([...events, res.data]);
        setNewEvent({ name: "", date: "", organizer_id: 0 });
        setOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box p={6}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">My Events</Heading>
        <Dialog.Root open={open} onOpenChange={(val) => setOpen(val.open)}>
          <Dialog.Trigger asChild>
            <Button colorScheme="blue" size={'sm'}>Create Event</Button>
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Create a new event</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <VStack gap={4}>
                    <ChakraSelect.Root collection={clubsCollection}>
                      <ChakraSelect.HiddenSelect />
                      <ChakraSelect.Label>Select club hosting the event</ChakraSelect.Label>
                      <ChakraSelect.Control>
                        <ChakraSelect.Trigger>
                          <ChakraSelect.ValueText placeholder="Select club" />
                        </ChakraSelect.Trigger>
                        <ChakraSelect.IndicatorGroup>
                          <ChakraSelect.Indicator />
                        </ChakraSelect.IndicatorGroup>
                      </ChakraSelect.Control>
                      <Portal>
                        <ChakraSelect.Positioner>
                          <ChakraSelect.Content zIndex={1500}>
                            {clubsCollection.items.map((club) => (
                              <ChakraSelect.Item
                                key={club.value}
                                item={club}
                                onClick={() => setNewEvent({ ...newEvent, organizer_id: club.value })}
                              >
                                {club.label}
                                <ChakraSelect.ItemIndicator />
                              </ChakraSelect.Item>
                            ))}
                          </ChakraSelect.Content>
                        </ChakraSelect.Positioner>
                      </Portal>
                    </ChakraSelect.Root>

                    <Field.Root>
                      <Field.Label>Name of event</Field.Label>
                      <Input
                        placeholder="Event name"
                        value={newEvent.name}
                        onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                      />
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Date of event</Field.Label>
                      <Input
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      />
                    </Field.Root>
                  </VStack>
                </Dialog.Body>

                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </Dialog.ActionTrigger>
                  <Button colorScheme="blue" onClick={handleCreateEvent}>Submit</Button>
                </Dialog.Footer>

                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Box>

      {loading ? (
        <Text>Loading events...</Text>
      ) : events.length === 0 ? (
        <Text>No events created yet.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} mb={4}>
          {events.map((event) => (
            <Card.Root
              key={event.id}
              cursor="pointer"
              onClick={() => navigate(`/dashboard/events/${event.id}`)}
              _hover={{ shadow: "md", transform: "scale(1.02)", transition: "all 0.2s" }}
            >
              <CardBody>
                <Heading size="md">{event.name}</Heading>
                <Text fontSize="sm" color="gray.600">{event.date}</Text>
              </CardBody>
            </Card.Root>
          ))}
        </SimpleGrid>
      )}

      { /* Participating Events */ }
      <Heading size="lg" mb={4}>Participating Events</Heading>
      {loadingParticipating ? (
        <Text>Loading participating events...</Text>
      ) : participatingEvents.length === 0 ? (
        <Text>Your clubs are not participating in any events yet.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          {participatingEvents.map((event) => (
            <Card.Root
              key={event.id}
              cursor="pointer"
              onClick={() => navigate(`/dashboard/events/${event.id}`)}
              _hover={{ shadow: "md", transform: "scale(1.02)", transition: "all 0.2s" }}
            >
              <CardBody>
                <Heading size="md">{event.name}</Heading>
                <Text fontSize="sm" color="gray.600">{event.date}</Text>
              </CardBody>
            </Card.Root>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
