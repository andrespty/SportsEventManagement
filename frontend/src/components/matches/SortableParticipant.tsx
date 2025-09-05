import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { Flex, Text } from "@chakra-ui/react";
import { GoGrabber } from "react-icons/go";
import { CSS } from "@dnd-kit/utilities";

interface Participant {
  id: number; 
  name: string;
  seed: number;
}

const SortableParticipant: React.FC<{ participant: Participant }> = ({ participant }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: participant.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "8px 12px",
    borderRadius: "8px",
    background: isDragging ? "lightgray" : "white",
    boxShadow: isDragging ? 'xl' : 'sm',
    width: "100%",
    cursor: isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <Flex alignItems={'center'} justifyContent={'space-between'} ref={setNodeRef} style={style} {...attributes} {...listeners} _hover={{ bg: "gray.100" }}>
        <Text fontWeight="bold">{participant.name}</Text>
        <GoGrabber />
    </Flex>
  );
};

export default SortableParticipant