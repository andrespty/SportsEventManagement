import React, { useState, useRef } from 'react'
import { Box, Text, VStack, Heading, Table, Tag, HStack, Dialog, Portal, Button, Input, Select, createListCollection } from '@chakra-ui/react'
import { useAuth } from '../../../context/AuthContext'
import DrawerComponent from '../../../components/DrawerComponent'
import MatchCreationForm from '../../../components/MatchCreationForm'
import { useToastContext } from '../../../context/ToastContext'
import { apiFetch } from '../../../lib/api'
import BracketBuilder, { BracketBuilderRef } from '../../../components/matches/BracketBuilder'
import { useOutletContext } from 'react-router-dom';

interface CreateMatchApiResponse {
    id: number,
    category_id: number,
    round: number,
    match_number: number,
    participants: []
}

function EventSchedules() {
  const { event, refreshEvent, isOrganizerOwner } = useOutletContext<EventContext>();
  const { token } = useAuth()
  const { createToast } = useToastContext()
  const [formData, setFormData] = useState<{
    type?: string;
    categoryId?: number;
    participantIds?: number[];
  }>({});
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchScores, setMatchScores] = useState<{[key: number]: number}>({});
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
  const [matchStatus, setMatchStatus] = useState<string>('');
  const [showCloseMatchDialog, setShowCloseMatchDialog] = useState(false);
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

  const handleMatchClick = (match: any) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
    setMatchStatus(match.status);
    // Initialize scores and winner from existing match data
    const scores: {[key: number]: number} = {};
    let winner: number | null = null;
    console.log(match)
    match.participants.forEach((mp: any) => {
      if (mp.score !== null && mp.score !== undefined) {
        scores[mp.participant.id] = mp.score;
      }
      if (mp.rank === 1) {
        winner = mp.participant.id;
      }
    });
    
    setMatchScores(scores);
    setSelectedWinner(winner);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
    setMatchScores({});
    setSelectedWinner(null);
    setMatchStatus('');
    setShowCloseMatchDialog(false);
  };

  const handleScoreChange = (participantId: number, score: number) => {
    setMatchScores(prev => ({
      ...prev,
      [participantId]: score
    }));
  };

  const handleStatusChange = (status: string) => {
    setMatchStatus(status);
  };

  const determineWinnerFromScores = () => {
    if (!selectedMatch) return null;
    
    let highestScore = -1;
    let winnerId: number | null = null;
    
    selectedMatch.participants.forEach((mp: any) => {
      const score = matchScores[mp.participant.id] || 0;
      if (score > highestScore) {
        highestScore = score;
        winnerId = mp.participant.id;
      }
    });
    
    return winnerId;
  };

  const handleCloseMatch = async () => {
    if (!selectedMatch || !isOrganizerOwner) return;

    const winnerId = determineWinnerFromScores();
    if (!winnerId) {
      createToast({
        title: 'Error',
        description: 'Could not determine winner from scores',
        type: 'error'
      });
      return;
    }

    // try {
    //   // Set the winner and close the match
    //   const response = await apiFetch<ApiResponse<any>>(`/api/matches/${selectedMatch.id}/set-winner`, {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       winner_id: winnerId
    //     }),
    //   });

    //   if (response.success) {
    //     createToast({
    //       title: 'Success',
    //       description: 'Match closed and winner set successfully',
    //       type: 'success'
    //     });
    //     refreshEvent();
    //     handleCloseModal();
    //   } else {
    //     createToast({
    //       title: 'Error',
    //       description: response.error?.message || 'Failed to close match',
    //       type: 'error'
    //     });
    //   }
    // } catch (error) {
    //   createToast({
    //     title: 'Error',
    //     description: 'Failed to close match',
    //     type: 'error'
    //   });
    // }
  };

  const handleSaveMatch = async () => {
    if (!selectedMatch || !isOrganizerOwner) return;
    console.log(matchScores)
    // try {
    //   // If it's a bracket match and we have a winner, use the set_winner endpoint
    //   if (selectedMatch.category?.is_bracket && selectedWinner) {
    //     const response = await apiFetch<ApiResponse<any>>(`/api/matches/${selectedMatch.id}/set-winner`, {
    //       method: 'POST',
    //       headers: {
    //         'Authorization': `Bearer ${token}`,
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({
    //         winner_id: selectedWinner
    //       }),
    //     });

    //     if (response.success) {
    //       createToast({
    //         title: 'Success',
    //         description: 'Match winner set successfully',
    //         type: 'success'
    //       });
    //       refreshEvent();
    //       handleCloseModal();
    //     } else {
    //       createToast({
    //         title: 'Error',
    //         description: response.error?.message || 'Failed to set winner',
    //         type: 'error'
    //       });
    //     }
    //   } else {
    //     // For non-bracket matches or when just updating scores
    //     // You might want to implement a different endpoint for updating scores
    //     createToast({
    //       title: 'Info',
    //       description: 'Score updating not yet implemented for this match type',
    //       type: 'info'
    //     });
    //   }
    // } catch (error) {
    //   createToast({
    //     title: 'Error',
    //     description: 'Failed to update match',
    //     type: 'error'
    //   });
    // }
  };

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
                  <Table.Row 
                    key={match.id}
                    cursor="pointer"
                    _hover={{ bg: "gray.50" }}
                    onClick={() => handleMatchClick(match)}
                  >
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

      {/* Match Edit Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={(e) => !e.open && handleCloseModal()}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxWidth="600px">
              <Dialog.Header>
                <Dialog.Title>Edit Match</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <Button variant="ghost" size="sm">
                    ×
                  </Button>
                </Dialog.CloseTrigger>
              </Dialog.Header>
              
              {selectedMatch && (
                <Dialog.Body>
                  <VStack gap={4} align="stretch">
                    <Box>
                      <Text fontWeight="bold" mb={2}>Match Details:</Text>
                      <Text>Round: {selectedMatch.round}</Text>
                      <Text>Match #: {selectedMatch.match_number}</Text>
                      <HStack gap={2} align="center">
                        <Text>Status:</Text>
                        <Select.Root 
                          collection={createListCollection({
                            items: [
                              { value: "scheduled", label: "Scheduled" },
                              { value: "live", label: "Live" },
                              { value: "finished", label: "Finished" }
                            ]
                          })}
                          value={[matchStatus]} 
                          onValueChange={(details) => handleStatusChange(details.value[0])}
                        >
                          <Select.HiddenSelect />
                          <Select.Control>
                            <Select.Trigger width="150px">
                              <Select.ValueText placeholder="Select status" />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                              <Select.Indicator />
                            </Select.IndicatorGroup>
                          </Select.Control>
                          <Portal>
                            <Select.Positioner>
                              <Select.Content>
                                <Select.Item item={{ value: "scheduled", label: "Scheduled" }}>
                                  <Select.ItemText>Scheduled</Select.ItemText>
                                  <Select.ItemIndicator />
                                </Select.Item>
                                <Select.Item item={{ value: "live", label: "Live" }}>
                                  <Select.ItemText>Live</Select.ItemText>
                                  <Select.ItemIndicator />
                                </Select.Item>
                                <Select.Item item={{ value: "finished", label: "Finished" }}>
                                  <Select.ItemText>Finished</Select.ItemText>
                                  <Select.ItemIndicator />
                                </Select.Item>
                              </Select.Content>
                            </Select.Positioner>
                          </Portal>
                        </Select.Root>
                      </HStack>
                    </Box>

                    <Box>
                      <Text fontWeight="bold" mb={2}>Participants:</Text>
                      <VStack gap={2} align="stretch">
                        {selectedMatch.participants.map((mp: any) => (
                          <HStack key={mp.id} justify="space-between" p={2} border="1px" borderColor="gray.200" borderRadius="md">
                            <Text>{mp.participant.name}</Text>
                            <HStack gap={2}>
                              <Input
                                type="number"
                                placeholder="Score"
                                value={matchScores[mp.participant.id] || ''}
                                onChange={(e) => handleScoreChange(mp.participant.id, Number(e.target.value))}
                                width="100px"
                              />
                              {selectedMatch.category?.is_bracket && (
                                <Button
                                  size="sm"
                                  variant={selectedWinner === mp.participant.id ? "solid" : "outline"}
                                  colorScheme={selectedWinner === mp.participant.id ? "green" : "gray"}
                                  onClick={() => setSelectedWinner(mp.participant.id)}
                                >
                                  {selectedWinner === mp.participant.id ? "Winner" : "Set Winner"}
                                </Button>
                              )}
                            </HStack>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>

                    {selectedMatch.category?.is_bracket && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          For bracket matches, setting a winner will automatically advance them to the next round.
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Dialog.Body>
              )}

              <Dialog.Footer>
                <HStack gap={2}>
                  <Button variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="blue" 
                    onClick={handleSaveMatch}
                    disabled={!isOrganizerOwner}
                  >
                    Save Changes
                  </Button>
                  {selectedMatch?.category?.is_bracket && (
                    <Button 
                      colorScheme="red" 
                      variant="outline"
                      onClick={() => setShowCloseMatchDialog(true)}
                      disabled={!isOrganizerOwner || matchStatus === 'finished'}
                    >
                      Close Match
                    </Button>
                  )}
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Close Match Warning Dialog */}
      <Dialog.Root open={showCloseMatchDialog} onOpenChange={(e) => !e.open && setShowCloseMatchDialog(false)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxWidth="400px">
              <Dialog.Header>
                <Dialog.Title>Close Match</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Close match
                  </Button>
                </Dialog.CloseTrigger>
              </Dialog.Header>
              
              <Dialog.Body>
                <VStack gap={3} align="stretch">
                  <Text>
                    Are you sure you want to close this match? This will automatically set the winner based on the highest score.
                  </Text>
                  
                  {selectedMatch && (
                    <Box p={3} bg="gray.50" borderRadius="md">
                      <Text fontWeight="bold" mb={2}>Current Scores:</Text>
                      {selectedMatch.participants.map((mp: any) => (
                        <Text key={mp.id}>
                          {mp.participant.name}: {matchScores[mp.participant.id] || 0} points
                        </Text>
                      ))}
                      <Text fontWeight="bold" mt={2} color="green.600">
                        Winner will be: {selectedMatch.participants.find((mp: any) => 
                          (matchScores[mp.participant.id] || 0) === Math.max(...selectedMatch.participants.map((p: any) => matchScores[p.participant.id] || 0))
                        )?.participant.name || 'Unable to determine'}
                      </Text>
                    </Box>
                  )}
                  
                  <Text fontSize="sm" color="red.600">
                    This action cannot be undone.
                  </Text>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer>
                <HStack gap={2}>
                  <Button variant="outline" onClick={() => setShowCloseMatchDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="red" 
                    onClick={handleCloseMatch}
                  >
                    Close Match
                  </Button>
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </VStack>
  );
}

export default EventSchedules