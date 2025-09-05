// src/components/event/MyParticipants.tsx
import React, { useEffect, useState } from "react";
import { Box, HStack, Heading, Text, Button, VStack, Input, IconButton, Dialog, Portal, Field, Select, createListCollection } from "@chakra-ui/react";
import { apiFetch } from "../../lib/api";
import { ApiResponse } from "../../types/common";
import { EventParticipant } from "../../types/models";
import { useAuth } from "../../context/AuthContext";
import { FiX } from "react-icons/fi";
import { useEvent } from "../../context/EventContext";
import { useToastContext } from "../../context/ToastContext";

const MyParticipants: React.FC = () => {
  const { event, refreshEvent} = useEvent()
  const { token, user } = useAuth();
  const [newName, setNewName] = useState("");
  const [ newCategories, setNewCategories ] = useState<string[]>([])
  const [ newClub, setNewClub ] = useState<number>(0)
  const { createToast } = useToastContext()

  const myParticipants = event?.participants.filter((p) =>
    user?.clubs?.some((club) => club.id === p.club_id)
  );
  
  const categories = createListCollection({
    items: event?.categories?.map((category:{id:number, name:string})=>({label:category.name, value: category.id})) || []
  })

  const clubsCollection = createListCollection({
      items: user?.clubs?.map((club: { id: number; name: string }) => ({ label: club.name, value: club.id })) || [],
  });

  const addParticipant = async () => {
    console.log(newName, newCategories, newClub)
    if (!newName.trim()) return;
    try {
      const clubId = newClub !== 0 ? newClub : user?.clubs[0].id
      const res = await apiFetch<ApiResponse<EventParticipant>>(
        `/api/events/${event?.id}/participants/${clubId}/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newName, category_ids: newCategories }),
        }
      );
      if (res.success) {
        createToast({
          title: 'Success',
          description: "Participant added successfully",
          type:'success'
        })
        refreshEvent();
      }
    } catch (err) {
      console.error("Failed to add participant", err);
    }
  };

  const deleteParticipant = async (id: number) => {
    try {
      const res = await apiFetch<ApiResponse<null>>(
        `/api/events/${event?.id}/participants/${user?.clubs[0].id}/remove/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.success) {
        refreshEvent();
      }
    } catch (err) {
      console.error("Failed to delete participant", err);
    }
  };

  useEffect(() => {
    // fetchMyParticipants();
  }, [event, token]);

  return (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Heading size="sm">My Participants</Heading>
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <Button variant='outline' size={'xs'}>
                    Add Participant
                </Button>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Add New Participant</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <VStack mb={4}>
                                <Field.Root>
                                    <Field.Label>Participant Name</Field.Label>
                                    <Input
                                    size="sm"
                                    placeholder="John Doe"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    />
                                </Field.Root>
                                <Select.Root 
                                  multiple 
                                  collection={categories} 
                                  size='sm'
                                  value={newCategories}
                                  onValueChange={(details) => setNewCategories(details.value)}                              
                                >
                                    <Select.HiddenSelect/>
                                    <Select.Label>Category</Select.Label>
                                    <Select.Control>
                                        <Select.Trigger>
                                            <Select.ValueText placeholder="Select categories" />
                                        </Select.Trigger>
                                        <Select.IndicatorGroup>
                                            <Select.Indicator />
                                        </Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal />
                                    <Select.Positioner>
                                        <Select.Content>
                                            {
                                                categories.items.map((cat) => (
                                                    <Select.Item item={cat} key={cat.value}>
                                                        {cat.label}
                                                        <Select.ItemIndicator />
                                                    </Select.Item>
                                                ))
                                            }
                                        </Select.Content>
                                    </Select.Positioner>
                                </Select.Root>
                                <Select.Root collection={clubsCollection} size='sm'>
                                    <Select.HiddenSelect/>
                                    <Select.Label>Participant's Club</Select.Label>
                                    <Select.Control>
                                        <Select.Trigger>
                                            <Select.ValueText placeholder="Select club" />
                                        </Select.Trigger>
                                        <Select.IndicatorGroup>
                                            <Select.Indicator />
                                        </Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal />
                                    <Select.Positioner>
                                        <Select.Content>
                                            {
                                                clubsCollection.items.map((cat) => (
                                                    <Select.Item 
                                                      item={cat} 
                                                      key={cat.value}
                                                      onClick={() => setNewClub(cat.value)}
                                                    >
                                                        {cat.label}
                                                        <Select.ItemIndicator />
                                                    </Select.Item>
                                                ))
                                            }
                                        </Select.Content>
                                    </Select.Positioner>
                                </Select.Root>
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer>
                                    <Button size="sm" onClick={addParticipant} disabled={newName.length === 0}>
                                    Add
                                    </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
      </HStack>

      

      { myParticipants && myParticipants.length > 0 ? (
        <VStack align="stretch" gap={2}>
          {myParticipants.map((p) => (
            <HStack
              key={p.id}
              justify="space-between"
              borderWidth="1px"
              borderRadius="md"
              p={2}
            >
              <Text>{p.name}</Text>
              <IconButton
                size="xs"
                aria-label="Delete participant"
                onClick={() => deleteParticipant(p.id)}
              >
                <FiX />
              </IconButton>
            </HStack>
          ))}
        </VStack>
      ) : (
        <Text>No participants yet.</Text>
      )}
    </Box>
  );
};

export default MyParticipants;
