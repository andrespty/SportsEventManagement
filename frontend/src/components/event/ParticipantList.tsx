import React from "react";
import { VStack, Text, Accordion, Span, HStack } from "@chakra-ui/react";
import { groupParticipantsByCategory } from "../../utils/groupParticipantsByCategory";

interface ParticipantListProps {
  participants: EventParticipant[];
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants }) => {
  const categories = groupParticipantsByCategory(participants);
  return (
    <Accordion.Root multiple defaultValue={[String(categories[0]?.id)]}>
      {categories.map((cat) => (
        <Accordion.Item key={cat.id} value={String(cat.id)}>
          <Accordion.ItemTrigger>
            <Span flex="1">{cat.name}</Span>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>

          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <VStack align="stretch" gap={1}>
                {cat.participants.map((p) => (
                  <HStack key={p.id} p={1} justify={'space-between'}>
                    <Text>
                      {p.name}
                    </Text>
                    <Text as="span" color="gray.500">
                      {p.club.name}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
};

export default ParticipantList;
