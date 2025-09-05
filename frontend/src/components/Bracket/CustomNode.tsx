import React from "react";
import { Box, Text, Flex } from "@chakra-ui/react";
import { Handle, Position } from "@xyflow/react";

interface Participant {
  id: number; 
  name: string;
  seed: number;
}

interface Match {
  id: number;
  round: number;
  match_number: number;      // only visible matches
  slots: (Participant | null)[];
  hidden?: boolean;          // for pure byes
  sourceIds?: number[];      // for edges
  displaySourceNumbers?: (number | undefined)[];// for rendering "Winner of Match X"
}

const CustomNode: React.FC<{ data: { match: Match } }> = ({ data }) => {
  const match = data.match;
  const handleStyle = {
    width: 0,
    height: 0,
    background: 'transparent',
    border: 'none',
  };

  return (
    <Box
      bg="white"
      borderRadius="xl"
      boxShadow="md"
      p={3}
      w="48"
      textAlign="center"
      position="relative"
    >
      {/* Incoming edges on the left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ ...handleStyle, left: -5, top: '50%', transform: 'translateY(-50%)' }}
      />

      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>
        Match {match.match_number}
      </Text>
        <Box p={1} borderRadius="md" bg="gray.100">
          {
            match.slots[0]
              ? 
                <Flex>
                  <Text w='25%' >{(match.slots[0] as any).seed}</Text>
                  <Text flex={1} textAlign={'left'}>{match.slots[0].name}</Text>
                </Flex>
              : match.displaySourceNumbers?.[0]
                ? `Winner of Match ${match.displaySourceNumbers[0]}`
                : "TBD"
          }
        </Box>
        

        <Box p={1} borderRadius="md" bg="gray.100">
            {
            match.slots[1]
              ? 
                <Flex>
                  <Text w='25%' >{(match.slots[1] as any).seed}</Text>
                  <Text flex={1} textAlign={'left'}>{match.slots[1].name}</Text>
                </Flex>
              : match.displaySourceNumbers?.[1]
                ? `Winner of Match ${match.displaySourceNumbers[1]}`
                : "TBD"
          }
        </Box>
      {/* Outgoing edges on the right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ ...handleStyle, right: -5, top: '50%', transform: 'translateY(-50%)' }}
      />
    </Box>
  );
};

export default CustomNode