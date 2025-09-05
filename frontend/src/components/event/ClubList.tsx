import React from "react";
import { VStack, Box, Text } from "@chakra-ui/react";
import { Club } from "../../types/models";

interface ClubListProps {
  clubs: Club[];
}

const ClubList: React.FC<ClubListProps> = ({ clubs }) => {
  return (
    <VStack align="stretch" gap={2}>
      {clubs.map((club) => (
        <Box key={club.id} p={2} borderWidth="1px" rounded="md">
          <Text fontWeight="bold">{club.name}</Text>
        </Box>
      ))}
    </VStack>
  );
};

export default ClubList;
