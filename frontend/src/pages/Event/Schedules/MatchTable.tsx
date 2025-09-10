import React, { useState } from 'react';
import { Table, Box, Text } from '@chakra-ui/react';
import MatchDialog from './MatchDialog';

interface MatchTableProps {
  matches: Match[];
}

const MatchTable: React.FC<MatchTableProps> = ({ matches }) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (matches.length === 0) {
    return <Text>No matches scheduled yet.</Text>;
  }

  return (
    <Box>
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
          {matches.map((match) => (
            <Table.Row 
              key={match.id}
              cursor="pointer"
              _hover={{ bg: "gray.50" }}
              onClick={() => {
                setSelectedMatch(match);
                setIsDialogOpen(true);
              }}
            >
              <Table.Cell>{match.round}</Table.Cell>
              <Table.Cell>{match.match_number}</Table.Cell>
              <Table.Cell>
                {match.participants.map((mp) => (
                  <Box
                    key={mp.id}
                    display="inline-block"
                    bg="blue.100"
                    color="blue.800"
                    px={2}
                    py={1}
                    borderRadius="md"
                    mr={2}
                    mb={1}
                  >
                    {mp.participant.name}
                    {mp.rank ? ` (${mp.rank})` : ""}
                  </Box>
                ))}
              </Table.Cell>
              <Table.Cell>
                <Box
                  display="inline-block"
                  px={2}
                  py={1}
                  borderRadius="md"
                  bg={
                    match.status === "completed"
                      ? "green.100"
                      : match.status === "upcoming"
                      ? "yellow.100"
                      : "gray.100"
                  }
                  color={
                    match.status === "completed"
                      ? "green.800"
                      : match.status === "upcoming"
                      ? "yellow.800"
                      : "gray.800"
                  }
                >
                  {match.status}
                </Box>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <MatchDialog
        match={selectedMatch}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedMatch(null);
        }}
      />
    </Box>
  );
};

export default MatchTable;