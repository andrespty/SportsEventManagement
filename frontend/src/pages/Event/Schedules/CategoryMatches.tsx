import React from 'react';
import { Box, Heading } from '@chakra-ui/react';
import MatchTable from './MatchTable';

interface CategoryMatchesProps {
  category: CategoryFull;
  onMatchClick: (match: Match) => void;
}

const CategoryMatches: React.FC<CategoryMatchesProps> = ({ category, onMatchClick }) => {
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      shadow="sm"
      p={5}
    >
      <Heading size="md" mb={4}>
        {category.name}
      </Heading>
      <MatchTable 
        matches={category.matches || []} 
        onMatchClick={onMatchClick}
      />
    </Box>
  );
};

export default CategoryMatches;