import React, { useState } from "react";
import { Box, Select, Portal, createListCollection } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import BracketViewer from "../../components/Bracket/BracketViewer";


const EventMatches: React.FC = () => {
  const { event } = useOutletContext<EventContext>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  if (!event) return null;
  
  // Set default category if none selected and categories exist
  if (selectedCategoryId === null && event.categories && event.categories.length > 0) {
    setSelectedCategoryId(event.categories[0].id);
  }

  // Create collection for categories
  const categoriesCollection = createListCollection({
    items: event?.categories 
      ? event.categories.map((cat: CategorySimple) => ({
          label: cat.name,
          value: cat.id
        })) 
      : []
  });

  return (
    <Box>
      <Box mb={4}>
        <Select.Root collection={categoriesCollection}>
          <Select.HiddenSelect />
          <Select.Label>Category</Select.Label>
          <Select.Control>
            <Select.Trigger minWidth="200px">
              <Select.ValueText placeholder="Select a category" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content zIndex={1500}>
                {categoriesCollection.items.map((cat: any) => (
                  <Select.Item
                    key={cat.value}
                    item={cat}
                    onClick={() => setSelectedCategoryId(cat.value)}
                  >
                    {cat.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Box>
      {selectedCategoryId && <BracketViewer categoryId={selectedCategoryId} />}
    </Box>
  );
};

export default EventMatches;
