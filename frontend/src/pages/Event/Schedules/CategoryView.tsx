import React from 'react';
import { Heading } from '@chakra-ui/react';
import MatchTable from './MatchTable';

interface CategoryViewProps {
  category: CategoryFull;
}

const CategoryView: React.FC<CategoryViewProps> = ({ category }) => {
  return (
    <>
      <Heading size="md" mb={4}>
        {category.name}
      </Heading>
      <MatchTable matches={category.matches || []}/>
    </>
  );
};

export default CategoryView;