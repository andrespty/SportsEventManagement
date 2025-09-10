import React from 'react';
import { Dialog, Button, Text, VStack, Box, HStack, Input, Select, Portal, createListCollection } from '@chakra-ui/react';

interface EditMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  matchStatus: string;
  matchScores: {[key: number]: number};
  dialogStep: 'edit' | 'confirm' | 'closeMatch';
  isOrganizerOwner: boolean;
  onStatusChange: (status: string) => void;
  onScoreChange: (participantId: number, score: number) => void;
  onSave: () => void;
  setDialogStep: (step: 'edit' | 'confirm' | 'closeMatch') => void;
  isBracketMatch?: boolean;
}

const EditMatchDialog: React.FC<EditMatchDialogProps> = ({
  isOpen,
  onClose,
  match,
  matchStatus,
  matchScores,
  dialogStep,
  isOrganizerOwner,
  onStatusChange,
  onScoreChange,
  onSave,
  setDialogStep,
  isBracketMatch
}) => {
  const statusCollection = createListCollection({
    items: [
      { value: "scheduled", label: "Scheduled" },
      { value: "live", label: "Live" },
      { value: "finished", label: "Finished" }
    ]
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxWidth="600px">
            <Dialog.Header>
              <Dialog.Title>Edit Match</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="sm">×</Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            
            {match && (
              <>
                <Dialog.Body>
                  {/* Edit Step */}
                  {dialogStep === 'edit' && (
                    <VStack gap={4} align="stretch">
                      {/* Match Details */}
                      <Box>
                        <Text fontWeight="bold" mb={2}>Match Details:</Text>
                        <HStack gap={2} align="center">
                          <Text>Round: {match.round}</Text>
                          <Text>Match #: {match.match_number}</Text>
                          <Select.Root 
                            collection={statusCollection}
                            value={[matchStatus]} 
                            onValueChange={(details) => onStatusChange(details.value[0])}
                          >
                            <Select.HiddenSelect />
                            <Select.Label>Status</Select.Label>
                            <Select.Control>
                              <Select.Trigger width="150px">
                                <Select.ValueText placeholder="Select status" />
                              </Select.Trigger>
                            </Select.Control>
                            <Select.Positioner>
                              <Select.Content>
                                <Select.ItemGroup>
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
                                </Select.ItemGroup>
                              </Select.Content>
                            </Select.Positioner>
                          </Select.Root>
                        </HStack>
                      </Box>

                      {/* Participants Scores */}
                      <Box>
                        <Text fontWeight="bold" mb={2}>Participants:</Text>
                        <VStack gap={2} align="stretch">
                          {match.participants.map((mp: MatchParticipant) => (
                            <HStack key={mp.id} justify="space-between" p={2} border="1px" borderColor="gray.200" borderRadius="md">
                              <Text>{mp.participant.name}</Text>
                              <Input
                                type="number"
                                placeholder="Score"
                                value={matchScores[mp.participant.id] || ''}
                                onChange={(e) => onScoreChange(mp.participant.id, Number(e.target.value))}
                                width="100px"
                              />
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    </VStack>
                  )}

                  {/* Confirm Step */}
                  {dialogStep === 'confirm' && (
                    <VStack gap={3} align="stretch">
                      <Text>Please confirm the following changes:</Text>
                      
                      <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                        <Text fontWeight="bold" mb={2}>Match Status: {matchStatus}</Text>
                        <Text fontWeight="bold" mt={3} mb={2}>Scores:</Text>
                        {match.participants.map((mp: MatchParticipant) => (
                          <Text key={mp.id}>
                            {mp.participant.name}: {matchScores[mp.participant.id] || 0} points
                          </Text>
                        ))}
                      </Box>

                      <Text fontSize="sm" color="orange.600">
                        These changes cannot be undone. Please verify the information before confirming.
                      </Text>
                    </VStack>
                  )}

                  {/* Close Match Step */}
                  {dialogStep === 'closeMatch' && (
                    <VStack gap={3} align="stretch">
                      <Text>
                        Are you sure you want to close this match? This will automatically set the winner based on the highest score.
                      </Text>
                      
                      <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                        <Text fontWeight="bold" mb={2}>Current Scores:</Text>
                        {match.participants.map((mp: MatchParticipant) => (
                          <Text key={mp.id}>
                            {mp.participant.name}: {matchScores[mp.participant.id] || 0} points
                          </Text>
                        ))}
                        <Text fontWeight="bold" mt={2} color="green.600">
                          Winner will be: {match.participants.find((mp: MatchParticipant) => 
                            (matchScores[mp.participant.id] || 0) === Math.max(...match.participants.map((p: MatchParticipant) => matchScores[p.participant.id] || 0))
                          )?.participant.name || 'Unable to determine'}
                        </Text>
                      </Box>
                      
                      <Text fontSize="sm" color="red.600">
                        This action cannot be undone.
                      </Text>
                    </VStack>
                  )}
                </Dialog.Body>

                <Dialog.Footer>
                  <HStack gap={2}>
                    {dialogStep === 'edit' ? (
                      <>
                        <Button variant="outline" onClick={onClose}>
                          Cancel
                        </Button>
                        <Button 
                          colorScheme="blue" 
                          onClick={() => setDialogStep('confirm')}
                          disabled={!isOrganizerOwner}
                        >
                          Next
                        </Button>
                        <Button 
                        colorScheme="red" 
                        variant="outline"
                        onClick={() => setDialogStep('closeMatch')}
                        disabled={!isOrganizerOwner || matchStatus === 'finished'}
                        >
                        Close Match
                        </Button>
                      </>
                    ) : dialogStep === 'confirm' ? (
                      <>
                        <Button variant="outline" onClick={() => setDialogStep('edit')}>
                          Back
                        </Button>
                        <Button 
                          colorScheme="blue" 
                          onClick={onSave}
                          disabled={!isOrganizerOwner}
                        >
                          Confirm Changes
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          colorScheme="red" 
                          onClick={onSave}
                          disabled={!isOrganizerOwner}
                        >
                          Close Match
                        </Button>
                        <Button variant="outline" onClick={() => setDialogStep('edit')}>
                          Back
                        </Button>
                      </>
                    )}
                  </HStack>
                </Dialog.Footer>
              </>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default EditMatchDialog;