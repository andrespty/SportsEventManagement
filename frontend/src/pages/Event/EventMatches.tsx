import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { useEvent } from "../../context/EventContext";
import BracketViewer from "../../components/Bracket/BracketViewer";

const EventMatches: React.FC = () => {
  const { event } = useEvent();

  if (!event) return null;
  console.log(event)
  return (
    <Box>
      <Text>Welcome to the overview of "{event.name}"!</Text>
      {/* Add more summary info, stats, charts, etc. */}
      <BracketViewer categoryId={1} />
    </Box>
  );
};

export default EventMatches;
