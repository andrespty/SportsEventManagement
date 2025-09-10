import React from 'react';
import { Table, Tag, Text } from '@chakra-ui/react';

interface ListMatchesProps {
  matches: Match[];
  onMatchClick: (match: Match) => void;
}

const ListMatches: React.FC<ListMatchesProps> = ({ matches, onMatchClick }) => {
  if (matches.length === 0) {
    return <Text>No matches scheduled yet.</Text>;
  }

  return (
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
            onClick={() => onMatchClick(match)}
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
  );
};

export default ListMatches;