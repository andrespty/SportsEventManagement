import { Box, Checkbox, Heading, Portal, Select, Stack, Text, CheckboxGroup, createListCollection, Flex } from "@chakra-ui/react";
import { CategoryFull, EventParticipant } from "../types/models";
import BracketBuilder from "./matches/BracketBuilder";

type MatchCreationFormProps = {
  categories: CategoryFull[];
  participants: EventParticipant[];
  onChange: React.Dispatch<React.SetStateAction<{
    type?: string;
    categoryId?: number;
    participantIds?: number[];
}>>
value: {
    type?: string;
    categoryId?: number;
    participantIds?: number[];
}
};

const MatchCreationForm = ({ categories, participants, onChange, value }: MatchCreationFormProps) => {

  const matchTypeCollection = createListCollection({
      items: [
          { label: 'Single Event', value: 0 }, 
          { label: 'Single Elimination Bracket', value: 1 }
      ]
    });

  const categoriesCollection = createListCollection({
      items: categories.map((cat: {id: number, name:string}) => ({label: cat.name, value: cat.id}))
  })

  const catParticipants = value.categoryId
  ? participants
      .filter((p) => p.categories.some((cat) => cat.id === value.categoryId))
      .map((p, i) => ({ ...p, seed: i + 1 }))
  : [];

  return (
    <Box p={4}>
      <Heading size="md" mb={4}>
        Create Match
      </Heading>

      <Flex gap={4}>
        {/* Match Type */}
        <Select.Root collection={matchTypeCollection}>
          <Select.HiddenSelect />
          <Select.Label>Match Type</Select.Label>
          <Select.Control>
              <Select.Trigger>
                  <Select.ValueText placeholder="Select Match Type" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                  <Select.Indicator/> 
              </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
              <Select.Positioner>
                  <Select.Content zIndex={1500}>
                      {
                          matchTypeCollection.items.map((type) => (
                          <Select.Item 
                              key={type.value} 
                              item={type} 
                              onClick={() => {
                                  onChange((prev) => ({...prev, type:type.label, participantIds:[]}))
                              }}
                          >
                              {type.label}
                              <Select.ItemIndicator />
                          </Select.Item>
                          ))
                      }
                  </Select.Content>
              </Select.Positioner>
          </Portal>
        </Select.Root>

        {/* Category */}
        <Select.Root collection={categoriesCollection} mb={4}>
          <Select.HiddenSelect />
          <Select.Label>Match Category</Select.Label>
          <Select.Control>
              <Select.Trigger>
                  <Select.ValueText placeholder="Select Category" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                  <Select.Indicator/> 
              </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
              <Select.Positioner>
                  <Select.Content zIndex={1500}>
                      {categoriesCollection.items.map((cat) => (
                      <Select.Item 
                          item={cat} 
                          key={cat.value}
                          onClick={() => {
                              onChange((prev) => ({...prev, categoryId:cat.value, participantIds:[]}))
                          }}
                      >
                          {cat.label}
                          <Select.ItemIndicator />
                      </Select.Item>
                      ))}
                  </Select.Content>
              </Select.Positioner>
          </Portal>
          
        </Select.Root>
      </Flex>
      {/* Conditional: Single Match */}
      {value.type && value.type === "Single Event" && value.categoryId && (
        <Box mb={4}>
          <Text mb={2}>Select participants for this match:</Text>
          <Stack gap={2}>
            <CheckboxGroup
                value={value.participantIds?.map(String)}
                onValueChange={(values: string[])=>{
                    onChange((prev) => ({...prev, participantIds:values.map(Number)}))
                }}
            >
            {catParticipants.map((p) => (
              <Checkbox.Root
                key={p.id}
                value={p.id.toString()}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control>
                    <Checkbox.Indicator/>
                </Checkbox.Control>
                <Checkbox.Label>{p.name}</Checkbox.Label>
              </Checkbox.Root>
            ))}
            </CheckboxGroup>
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default MatchCreationForm;
