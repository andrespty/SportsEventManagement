import React, { useState, useRef } from 'react'
import { useEvent } from '../../context/EventContext'
import { Box, Text, VStack, Heading, Table, Tag, HStack } from '@chakra-ui/react'
import { useAuth } from '../../context/AuthContext'
import DrawerComponent from '../../components/DrawerComponent'
import MatchCreationForm from '../../components/MatchCreationForm'
import { useToastContext } from '../../context/ToastContext'
import { apiFetch } from '../../lib/api'
import { ApiResponse } from '../../types/common'
import BracketBuilder, { BracketBuilderRef } from '../../components/matches/BracketBuilder'

interface CreateMatchApiResponse {
    id: number,
    category_id: number,
    round: number,
    match_number: number,
    participants: []
}

function EventSchedules() {
  const { event, refreshEvent } = useEvent()
  const { user, token } = useAuth()
  const { createToast } = useToastContext()
  const isOrganizerOwner = event && user?.clubs?.some((club) => club.id === event.organizer_id);
  const [formData, setFormData] = useState<{
    type?: string;
    categoryId?: number;
    participantIds?: number[];
  }>({});
  console.log(event)

  const bracketRef = useRef<BracketBuilderRef>(null);

  const createMatch = async () => {
    if (!formData.type || !formData.categoryId){
      createToast({
        title: 'Something is missing',
        description:'Match Type or Category not selected',
        type:'error'
      })
      return
    }
    if (formData.type === 'Single Event'){
      if (formData.participantIds && formData.participantIds?.length <= 1){
        createToast({
            title: 'Not enough participants',
            description:'Must select at least 2 participants',
            type:'error'
        })
        return
      }
      try {
        const res = await apiFetch<ApiResponse<CreateMatchApiResponse>>(`/api/events/${event?.id}/categories/${formData.categoryId}/matches`, {
          method: "POST",
          headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
          },
          body: JSON.stringify({
              participants: formData.participantIds
          }),
        });
        if (res.success){
          refreshEvent()
          createToast({
              title:"Success",
              description: "Match created successfully",
              type:"success"
          })
        }
        else{
          createToast({
              title:"Error",
              description: res.error.message,
              type:"error"
          })
        }
      } catch (err) {
        createToast({
              title:"Error",
              description: "Something happened",
              type:"error"
          })
      }
    }
    if (formData.type === 'Single Elimination Bracket'){
      const payload = bracketRef.current?.getPayload();

      if (!payload) {
        createToast({
          title: "No bracket",
          description: "Could not generate bracket payload",
          type: "error",
        });
        return;
      }
      console.log(payload)
      try {
        const res = await apiFetch<ApiResponse<CreateMatchApiResponse>>(`/api/events/${event?.id}/categories/${formData.categoryId}/bracket`, {
          method: "POST",
          headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        });
        if (res.success){
          refreshEvent()
          createToast({
            title:"Success",
            description: "Bracket created successfully",
            type:"success"
          })
        }
        else {
          createToast({
            title: "Error",
            description: res.error.message,
            type: 'error'
          })
        }
      } catch (err) {
        console.error("Failed to create match", err);
      }
    };
  }

  return (
    <VStack gap={3} align="stretch">
      <HStack justify={'space-between'}>
      <Heading size="lg">
        Event Matches
      </Heading>
        {
            isOrganizerOwner ?
            <DrawerComponent 
                triggerLabel='Create Match'
                title='Create Match'
                body={
                  <>
                    <MatchCreationForm 
                        categories={event?.categories} 
                        participants={event?.participants}
                        onChange={setFormData}
                        value={formData}
                    />
                    {/* Conditional: Bracket */}
                    {formData.type && formData.type === "Single Elimination Bracket" && formData.categoryId &&(
                      <BracketBuilder 
                        ref={bracketRef}
                        participants={
                          event?.participants.filter((p) => 
                            p.categories.some((cat) => cat.id === formData.categoryId))
                              .map((p, i) => ({ ...p, seed: i + 1 }))
                          || []
                        }
                      />
                    )}
                    </>
                }
                onConfirm={createMatch}
                size={'full'}
            />
            :<></>
        }
      </HStack>

      {event?.categories?.map((category) => (
        <Box
          key={category.id}
          borderWidth="1px"
          borderRadius="lg"
          shadow="sm"
          p={5}
        >
          <Heading size="md" mb={4}>
            {category.name}
          </Heading>
          {category.matches?.length > 0 ? (
            <Table.Root variant="outline" colorScheme="gray">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Round</Table.ColumnHeader>
                  <Table.ColumnHeader>Match #</Table.ColumnHeader>
                  <Table.ColumnHeader>Participants</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {category.matches.map((match) => (
                  <Table.Row key={match.id}>
                    <Table.Cell>{match.round}</Table.Cell>
                    <Table.Cell>{match.match_number}</Table.Cell>
                    <Table.Cell>
                      {match.participants.map((mp) => (
                        <Tag.Root
                          key={mp.id}
                          colorScheme="blue"
                          size="lg"
                          mr={2}
                          mb={1}
                        >
                            <Tag.Label>
                          {mp.participant.name}
                          {mp.rank ? ` (${mp.rank})` : ""}
                          </Tag.Label>
                        </Tag.Root>
                      ))}
                    </Table.Cell>
                    <Table.Cell>
                      <Tag.Root
                        colorScheme={
                          match.status === "completed"
                            ? "green"
                            : match.status === "upcoming"
                            ? "yellow"
                            : "gray"
                        }
                        >
                        <Tag.Label>
                            {match.status}
                        </Tag.Label>
                      </Tag.Root>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          ) : (
            <Text>No matches scheduled yet.</Text>
          )}
        </Box>
      ))}
    </VStack>
  );
}

export default EventSchedules