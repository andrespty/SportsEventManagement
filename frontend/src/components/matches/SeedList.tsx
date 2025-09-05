import React, { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import SortableParticipant from "./SortableParticipant";
import { Box, Flex, Text } from '@chakra-ui/react';
import { SeededParticipant } from '../Bracket/BracketDisplay';

interface SeedListProps {
    participants: SeededParticipant[],
    setParticipants:  React.Dispatch<React.SetStateAction<SeededParticipant[]>>
}

function SeedList({ participants, setParticipants}: SeedListProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const handleDragStart = (event: DragStartEvent) => {
            setActiveId(event.active.id as string);
        };
    
    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = participants.findIndex((p) => p.id === active.id);
        const newIndex = participants.findIndex((p) => p.id === over.id);
    
        const newOrder = arrayMove(participants, oldIndex, newIndex).map((p, i) => ({
          ...p,
          seed: i + 1,
        }));
    
        setParticipants(newOrder);
      }
      setActiveId(null);
    };
    // setup dnd-kit sensors
      const sensors = useSensors(useSensor(PointerSensor));
    
  return (
    <Box>
        <Text fontSize="lg" fontWeight="bold" mb={3}>
          Seed Order
        </Text>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          modifiers={[restrictToVerticalAxis]}
        >
            <SortableContext
                items={participants.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
            >
                <Flex direction='column' gap={1}>
                    {participants.map((p, index) => (
                        <Flex key={p.id} py={1} pl={2} align='center' gap={2} borderWidth={'1px'} borderRadius={'md'}>
                            <Text w='20px' textAlign={'right'} fontWeight={'bold'}>
                                {index + 1}
                            </Text>
                            <SortableParticipant participant={p} />
                        </Flex>
                    ))}
                </Flex>
            </SortableContext>
            <DragOverlay>
                {activeId ? (
                    <SortableParticipant
                        participant={
                            participants.find((p) => String(p.id) === String(activeId))!
                        }
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
      </Box>
  )
}

export default SeedList