import React, { useState } from 'react';
import { Box, Text, Heading, Flex, Stat, Badge, Separator, Button, IconButton, NumberInput, Select, ButtonGroup, createListCollection } from '@chakra-ui/react';
import { FaEdit } from 'react-icons/fa';
import { useOutletContext } from 'react-router-dom';

interface MatchInfoProps {
    match: Match;
    onSave?: (updatedMatch: {
        scores: { [key: number]: number };
        status: string;
    }) => Promise<void>;
}

const statusList = createListCollection({
  items: [
    { label: "Scheduled", value: "scheduled" },
    { label: "In Progress", value: "live" },
    { label: "Finished", value: "finished" },
  ],
})

const MatchInfo: React.FC<MatchInfoProps> = ({ match, onSave }) => {
    const { isOrganizerOwner } = useOutletContext<EventContext>();
    const [isEditing, setIsEditing] = useState(false);
    const [scores, setScores] = useState<{ [key: number]: number }>(() => {
        const initialScores: { [key: number]: number } = {};
        match.participants.forEach(p => {
            initialScores[p.participant.id] = p.score || 0;
        });
        return initialScores;
    });
    const [status, setStatus] = useState<string>(match.status);

    const handleScoreChange = (participantId: number, value: number) => {
        setScores(prev => ({
            ...prev,
            [participantId]: value
        }));
    };

    const handleSave = async () => {
        if (onSave) {
            await onSave({ scores, status });
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        // Reset to original values
        const originalScores: { [key: number]: number } = {};
        match.participants.forEach(p => {
            originalScores[p.participant.id] = p.score || 0;
        });
        setScores(originalScores);
        setStatus(match.status);
        setIsEditing(false);
    };

    return (
        <Flex direction="column" gap={4}>
            <Box>
                {match.start_time ? (
                    <Text>
                        Start Time: {new Date(match.start_time).toLocaleString()}
                    </Text>
                ) : (
                    <Text>Start Time: TBD</Text>
                )}
            </Box>
            <Box>
                <Flex alignItems="center" gap={4}>
                    <Stat.Root>
                        <Stat.Label>Round</Stat.Label>
                        <Stat.ValueText>{match.round}</Stat.ValueText>
                    </Stat.Root>
                    <Stat.Root>
                        <Stat.Label>Match #</Stat.Label>
                        <Stat.ValueText>{match.match_number}</Stat.ValueText>
                    </Stat.Root>
                    <Box>
                        {isEditing ? (
                            <Select.Root
                                collection={statusList}
                                value={[status]}
                                onSelect={(e) => setStatus(e.value)}
                                size="sm"
                                width="150px"
                                multiple={false}
                            >
                                <Select.HiddenSelect />
                                <Select.Control>
                                    <Select.Trigger>
                                        <Select.ValueText />
                                    </Select.Trigger>
                                    <Select.IndicatorGroup>
                                        <Select.Indicator />
                                    </Select.IndicatorGroup>
                                </Select.Control>
                                <Select.Positioner>
                                    <Select.Content>
                                        <Select.Item item={'scheduled'}>Scheduled</Select.Item>
                                        <Select.Item item={'live'}>In Progress</Select.Item>
                                        <Select.Item item={'finished'}>Finished</Select.Item>
                                    </Select.Content>
                                </Select.Positioner>
                            </Select.Root>
                        ) : (
                            <Badge
                                size='md'
                                variant='solid'
                                colorPalette={
                                    status === "scheduled"
                                        ? "blue"
                                        : status === "live"
                                            ? "green"
                                            : "gray"
                                }
                            >
                                {status === "scheduled"
                                    ? "Scheduled"
                                    : status === "live"
                                        ? "In Progress"
                                        : "Finished"}
                            </Badge>
                        )}
                    </Box>
                    {isOrganizerOwner && !isEditing && (
                        <IconButton
                            aria-label="Edit match"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                        >
                            <FaEdit />
                        </IconButton>
                    )}
                </Flex>
            </Box>

            <Separator />

            <Box>
                <Heading size="sm" mb={2}>Participants</Heading>
                <Flex direction="column" gap={2}>
                    {match.participants.map((participant) => (
                        <Flex
                            key={participant.id}
                            justify="space-between"
                            p={2}
                            border="1px solid"
                            borderColor="gray.200"
                            borderRadius="md"
                            align="center"
                        >
                            <Box>
                                <Text fontWeight="bold">
                                    {participant.participant.name}
                                </Text>
                            </Box>
                            {isEditing ? (
                                <NumberInput.Root
                                    value={scores[participant.participant.id].toString()}
                                    onValueChange={(e) => {
                                        console.log(e)
                                        handleScoreChange(participant.participant.id, isNaN(e.valueAsNumber) ? 0 : e.valueAsNumber)
                                    }}
                                    min={0}
                                    size="sm"
                                    width="100px"
                                >
                                    <NumberInput.Control>
                                        <NumberInput.IncrementTrigger />
                                        <NumberInput.DecrementTrigger />
                                    </NumberInput.Control>
                                    <NumberInput.Input />
                                </NumberInput.Root>
                            ) : (
                                <Box px={3} py={1} fontWeight="bold">
                                    {scores[participant.participant.id]}
                                </Box>
                            )}
                        </Flex>
                    ))}
                </Flex>
            </Box>

            {isEditing && (
                <ButtonGroup justifyContent="flex-end" size="sm" mt={2}>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button colorScheme="blue" onClick={handleSave}>
                        Save Changes
                    </Button>
                </ButtonGroup>
            )}
        </Flex>
    );
};

export default MatchInfo;
