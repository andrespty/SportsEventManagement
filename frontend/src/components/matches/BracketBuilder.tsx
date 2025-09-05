import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Box, Flex } from "@chakra-ui/react";
import BracketDisplay, { SeededParticipant, generateBracket } from "../Bracket/BracketDisplay";
import SeedList from "./SeedList";
import { EventParticipant } from "../../types/models";

export interface BracketBuilderRef {
  getPayload: () => { matches: any[]; relations: any[] } | null;
}

const BracketBuilder = forwardRef<BracketBuilderRef, { participants: EventParticipant[] }>(
  ({ participants }, ref) => {
    const [seededParticipants, setParticipants] = useState<SeededParticipant[]>([]);

    useEffect(() => {
      if (participants) {
        setParticipants(
          participants.map((p, i) => ({
            ...p,
            seed: i + 1,
          }))
        );
      }
    }, [participants]);

    useImperativeHandle(ref, () => ({
      getPayload: () => {
        if (!seededParticipants.length) return null;

        const rounds = generateBracket(seededParticipants);
        const idToMatchNumber: Record<number, number> = {};
        rounds.flat().forEach((m) => {
          if (!m.hidden) idToMatchNumber[m.id] = m.match_number;
        });

        const matches = rounds
          .flat()
          .filter((m) => !m.hidden)
          .map((m) => ({
            round: m.round,
            match_number: m.match_number,
            participants: m.slots
              .map((p, idx) =>
                p
                  ? {
                      participant_id: p.id,
                      role: "competitor",
                      position: `slot-${idx + 1}`,
                      seed: p.seed
                    }
                  : null
              )
              .filter(Boolean),
          }));

        const relations = rounds
          .flat()
          .filter((m) => m.sourceIds && m.sourceIds.length > 0)
          .flatMap((m) =>
            m.sourceIds!
              .map((srcId) => {
                const sourceMatchNumber = idToMatchNumber[srcId];
                const targetMatchNumber = idToMatchNumber[m.id];
                if (!sourceMatchNumber || !targetMatchNumber) return null;
                return {
                  source_match_number: sourceMatchNumber,
                  target_match_number: targetMatchNumber,
                  qualifier_rank: 1,
                };
              })
              .filter(Boolean)
          );

        return { matches, relations };
      },
    }));

    return (
      <Box w="100%" h="100vh" py={4}>
        <Flex w="100%" h="100%" gap={4}>
          <Box
            mb={6}
            p={4}
            borderRadius="xl"
            borderWidth={1}
            w="25%"
            minW="250px"
            h="100%"
            overflowY="auto"
          >
            <SeedList participants={seededParticipants} setParticipants={setParticipants} />
          </Box>
          <Box flex="1" h="100%" borderRadius="xl" borderWidth={1}>
            <BracketDisplay participants={seededParticipants} />
          </Box>
        </Flex>
      </Box>
    );
  }
);

export default BracketBuilder;
