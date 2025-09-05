import React, { useMemo, useState } from "react";
import { Box, Text, Flex } from "@chakra-ui/react";
import { ReactFlow, Node, Edge, Handle, Position } from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { GoGrabber } from "react-icons/go";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from "@dnd-kit/core";

interface Participant {
  id: number; 
  name: string;
  seed: number;
}

interface Match {
  id: number;
  round: number;
  match_number: number;      // only visible matches
  slots: (Participant | null)[];
  hidden?: boolean;          // for pure byes
  sourceIds?: number[];      // for edges
  displaySourceNumbers?: (number | undefined)[];// for rendering "Winner of Match X"
}


function seededOrder(n: number): number[] {
  if (n === 1) return [1];
  const half = n / 2;
  const prev = seededOrder(half);
  const comp = prev.map((s) => n + 1 - s);
  const out: number[] = [];
  for (let i = 0; i < prev.length; i++) {
    out.push(prev[i], comp[i]);
  }
  return out;
}

function buildRoundQueues(rounds: Match[][]): Match[][] {
    const allMatches = rounds.flat();
    const roundQueues: Match[][] = rounds.map(r => []);

    // Step 1: Initialize first round queue: all first-round matches with participants
    roundQueues[0] = rounds[0].filter(m => m.slots.some(s => s !== null));

    // Step 2: Process rounds dynamically to determine queue order
    for (let r = 0; r < rounds.length; r++) {
        const queue = roundQueues[r];

        while (queue.length > 0) {
            const match = queue.shift()!;

            // Determine parent match (match this one feeds into)
            const parent = allMatches.find(m => m.sourceIds?.includes(match.id));
            if (parent) {
                if (!roundQueues[r + 1]) roundQueues[r + 1] = [];

                const nextQueue = roundQueues[r + 1];

                // Remove parent from current position if it exists
                const index = nextQueue.findIndex(m => m.id === parent.id);
                if (index !== -1) nextQueue.splice(index, 1);

                // Push parent to the bottom of the queue
                nextQueue.push(parent);
            }
        }
    }

    return roundQueues;
}

function assignMatchNumbers(rounds: Match[][]): void {
    let matchCounter = 1;
    const allMatches = rounds.flat();
    const numberedMatches = new Map<number, number>();
    console.log(rounds)
    for (let r = 0; r < rounds.length; r++) {
        const round = rounds[r];
        // Iterate top-to-bottom
        for (let i = 0; i < round.length; i++) {
            const match = round[i];
            if (!match.hidden) {
                // Number this match
                match.match_number = matchCounter++;
                numberedMatches.set(match.id, match.match_number);
                // Find parent in next round
                const parent = rounds[r + 1]?.find(m => m.sourceIds?.includes(match.id));
                if (parent) {
                    // Remove parent from its current position
                    const parentIndex = rounds[r + 1]!.findIndex(m => m.id === parent.id);
                    if (parentIndex !== -1) {
                        rounds[r + 1]!.splice(parentIndex, 1);
                    }
    
                    // Push parent to the bottom
                    rounds[r + 1]!.push(parent);
                }
            }

        }
    }

    // Fill displaySourceNumbers
    allMatches.forEach(match => {
        if (match.sourceIds) {
            match.displaySourceNumbers = match.sourceIds.map(id => numberedMatches.get(id));
        }
    });
}

const generateBracket = (participants: Participant[]): Match[][] => {
  const playerCount = participants.length;
  const nextPower = Math.pow(2, Math.ceil(Math.log2(Math.max(1, playerCount))));
  const totalRounds = Math.log2(nextPower);

  // ---- 1) normalize + sort by seed (1 is strongest) ----
  const seeded = [...participants]
    .map((p, i) => ({ ...p, seed: (p as any).seed ?? i + 1 }))
    .sort((a, b) => a.seed - b.seed);

  // ---- 2) compute standard bracket placement order ----
  const order = seededOrder(nextPower); // e.g. 8 -> [1,8,4,5,2,7,3,6]

  // Map bracket slots to participants (null => bye)
  const slots: (Participant | null)[] = order.map((seedNum) => seeded[seedNum - 1] ?? null);

  const roundMatchMap: Record<number, Match[]> = {};
  let idCounter = 1;
  let visibleMatchCounter = 1;

  // ---- Round 1 (create visible matches; mark byes as hidden) ----
  roundMatchMap[1] = [];
  for (let i = 0; i < nextPower; i += 2) {
    const p1 = slots[i];
    const p2 = slots[i + 1];

    const isBye: boolean = (!!p1 && !p2) || (!!p2 && !p1);

    const match: Match = {
      id: idCounter++,
      round: 1,
      match_number: isBye ? 0 : visibleMatchCounter++, // no number for pure bye nodes
      slots: [p1, p2],
      hidden: isBye, // we won't render this node
    };

    roundMatchMap[1].push(match);
  }

  // ---- Later rounds ----
  for (let r = 2; r <= totalRounds; r++) {
    const prev = roundMatchMap[r - 1];
    const matchCount = prev.length / 2;
    roundMatchMap[r] = [];

    for (let i = 0; i < matchCount; i++) {
      const left = prev[i * 2];
      const right = prev[i * 2 + 1];

      // auto-advance only if the previous was a bye (hidden)
      const slots: (Participant | null)[] = [
        left.hidden ? left.slots[0] : null,
        right.hidden ? right.slots[0] : null,
      ];

      const match: Match = {
        id: idCounter++,
        round: r,
        match_number: visibleMatchCounter++,
        slots,
        sourceIds: [left.id, right.id],
        displaySourceNumbers: [
          left.hidden ? undefined : left.match_number,
          right.hidden ? undefined : right.match_number,
        ],
      };

      roundMatchMap[r].push(match);
    }
  }
  assignMatchNumbers(Object.values(roundMatchMap));
  return Object.values(roundMatchMap);
};

const computeNodePositions = (rounds: Match[][], xSpacing = 250, ySpacing = 120) => {
  const positions: Record<number, { x: number; y: number }> = {};

  // First round: assign positions to all matches (hidden or visible)
  rounds[0].forEach((match, i) => {
    positions[match.id] = { x: 0, y: i * ySpacing };
  });

  // Later rounds
  for (let r = 1; r < rounds.length; r++) {
    rounds[r].forEach((match) => {
      if (!match.sourceIds) return; // ✅ use sourceIds now

      const source1 = positions[match.sourceIds[0]];
      const source2 = match.sourceIds[1] != null ? positions[match.sourceIds[1]] : undefined;

      // fallback if sources are missing (can happen with hidden matches)
      const y1 = source1 ? source1.y : 0;
      const y2 = source2 ? source2.y : y1;

      positions[match.id] = {
        x: r * xSpacing,
        y: (y1 + y2) / 2,
      };
    });
  }

  return positions;
};

const CustomNode: React.FC<{ data: { match: Match } }> = ({ data }) => {
  const match = data.match;
  const handleStyle = {
    width: 0,
    height: 0,
    background: 'transparent',
    border: 'none',
  };

  return (
    <Box
      bg="white"
      borderRadius="xl"
      boxShadow="md"
      p={3}
      w="48"
      textAlign="center"
      position="relative"
    >
      {/* Incoming edges on the left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ ...handleStyle, left: -5, top: '50%', transform: 'translateY(-50%)' }}
      />

      <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>
        Match {match.match_number}
      </Text>
        <Box p={1} borderRadius="md" bg="gray.100">
        <Text>
        {match.slots[0]
            ? `${(match.slots[0] as any).seed}. ${match.slots[0].name}`
            : match.displaySourceNumbers?.[0]
            ? `Winner of Match ${match.displaySourceNumbers[0]}`
            : "TBD"}
        </Text>
        </Box>

        <Box p={1} borderRadius="md" bg="gray.100">
        <Text>
        {match.slots[1]
            ? `${(match.slots[1] as any).seed}. ${match.slots[1].name}`
            : match.displaySourceNumbers?.[1]
            ? `Winner of Match ${match.displaySourceNumbers[1]}`
            : "TBD"}
        </Text>
        </Box>


      {/* Outgoing edges on the right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ ...handleStyle, right: -5, top: '50%', transform: 'translateY(-50%)' }}
      />
    </Box>
  );
};

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
    width: "200px",
    cursor: isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <Flex justifyContent={'space-between'} ref={setNodeRef} style={style} {...attributes} {...listeners} _hover={{ bg: "gray.100" }}>
        <Text fontWeight="bold">{participant.name}</Text>
        <GoGrabber />
    </Flex>
  );
};


const BracketBuilder: React.FC = () => {
    const [activeId, setActiveId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([
    { id:1,name: "Alex", seed: 1 },
    { id:2,name: "James", seed: 2 },
    { id:3,name: "William", seed: 3 },
    { id:4,name: "Josh", seed: 4 },
    { id:5,name: "Tom", seed: 5 },
    { id:6,name: "Sally", seed: 6 },
    { id:7,name: "Natalie", seed: 7 },
    { id:8,name: "Carlos", seed: 8 },
    { id:9,name: "Stephan", seed: 9 },
    { id:10,name: "Will", seed: 10 },
  ]);

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
      seed: i + 1, // 🔑 reassign seeds after reordering
    }));

    setParticipants(newOrder);
  }
  setActiveId(null);
};


  // setup dnd-kit sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // rebuild bracket whenever participants change
  const rounds = useMemo(() => generateBracket(participants), [participants]);
  const nodePositions = computeNodePositions(rounds, 250, 120);

  const nodes: Node[] = useMemo(() => {
    const result: Node[] = [];
    rounds.forEach((round) => {
      round.forEach((match) => {
        if (match.hidden) return;
        const pos = nodePositions[match.id];
        result.push({
          id: match.id.toString(),
          position: { x: pos.x, y: pos.y },
          type: "customNode",
          data: { match },
        });
      });
    });
    return result;
  }, [rounds, nodePositions]);

  const edges: Edge[] = [];
  rounds.flat().forEach((match) => {
    if (!match.sourceIds || match.hidden) return;
    match.sourceIds.forEach((src) => {
      const sourceMatch = rounds.flat().find((m) => m.id === src);
      if (!sourceMatch || sourceMatch.hidden) return;
      edges.push({
        id: `e${src}-${match.id}`,
        source: sourceMatch.id.toString(),
        target: match.id.toString(),
      });
    });
  });

  return (
    <Box w="100%" h="100%" p={4} bg="gray.50">
      {/* Draggable Seeding List */}
      <Box mb={6} p={4} bg="white" borderRadius="xl" boxShadow="md">
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
            <Flex direction='column' gap={2}>
            {participants.map((p, index) => (
                <Flex key={p.id} align='center' gap={4}>
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

      {/* Bracket */}
      <Box w="100%" h="600px" bg="gray.50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={{ customNode: CustomNode }}
          fitView
        />
      </Box>
    </Box>
  );
};

export default BracketBuilder;