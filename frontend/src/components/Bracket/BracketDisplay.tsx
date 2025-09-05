import React, { useMemo } from "react";
import { ReactFlow, Node, Edge } from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import CustomNode from "./CustomNode";
import { EventParticipant } from "@/types/models";

export type SeededParticipant =  EventParticipant & {
  seed: number;
  score: number;
}

export interface MatchBracket {
  id: number;
  round: number;
  match_number: number;      // only visible matches
  slots: (SeededParticipant | null)[];
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

export function assignMatchNumbers(rounds: MatchBracket[][]): void {
    let matchCounter = 1;
    const allMatches = rounds.flat();
    const numberedMatches = new Map<number, number>();
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

export const generateBracket = (participants: SeededParticipant[]): MatchBracket[][] => {
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
  const slots: (SeededParticipant | null)[] = order.map((seedNum) => seeded[seedNum - 1] ?? null);

  const roundMatchMap: Record<number, MatchBracket[]> = {};
  let idCounter = 1;
  let visibleMatchCounter = 1;

  // ---- Round 1 (create visible matches; mark byes as hidden) ----
  roundMatchMap[1] = [];
  for (let i = 0; i < nextPower; i += 2) {
    const p1 = slots[i];
    const p2 = slots[i + 1];

    const isBye: boolean = (!!p1 && !p2) || (!!p2 && !p1);

    const match: MatchBracket = {
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
      const slots: (SeededParticipant | null)[] = [
        left.hidden ? left.slots[0] : null,
        right.hidden ? right.slots[0] : null,
      ];

      const match: MatchBracket = {
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

export const computeNodePositions = (
  rounds: MatchBracket[][] = [],
  xSpacing = 250,
  ySpacing = 100
) => {
  const positions: Record<number, { x: number; y: number }> = {};
  if (!rounds.length) return positions;

  rounds[0]?.forEach((match, i) => {
    positions[match.id] = { x: 0, y: i * ySpacing };
  });

  for (let r = 1; r < rounds.length; r++) {
    rounds[r]?.forEach((match, i) => {
      if (!match) return;
      if (!match.sourceIds || !match.sourceIds.length) {
        positions[match.id] = { x: r * xSpacing, y: i * ySpacing };
        return;
      }
      const sources = match.sourceIds
        .map((id) => positions[id])
        .filter((p): p is { x: number; y: number } => !!p);
      const avgY = sources.length
        ? sources.reduce((sum, p) => sum + p.y, 0) / sources.length
        : i * ySpacing;
      positions[match.id] = { x: r * xSpacing, y: avgY };
    });
  }

  return positions;
};

const BracketDisplay: React.FC<{participants: SeededParticipant[]}> = ({ participants }) => {
    // const [participants, setParticipants] = useState<Participant[]>([]);

    // rebuild bracket whenever participants change
    const rounds = useMemo(() => generateBracket(participants), [participants]);
    const nodePositions = useMemo(
      () => computeNodePositions(rounds, 250, 120),
      [rounds]
    );


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

    const edges: Edge[] = useMemo(() => {
      const result: Edge[] = [];
      rounds.flat().forEach((match) => {
        if (!match.sourceIds || match.hidden) return;
        match.sourceIds.forEach((src) => {
          const sourceMatch = rounds.flat().find((m) => m.id === src);
          if (!sourceMatch || sourceMatch.hidden) return;
          result.push({
            id: `e${src}-${match.id}`,
            source: sourceMatch.id.toString(),
            target: match.id.toString(),
          });
        });
      });
      return result;
    }, [rounds]);


    return (
      <ReactFlow
        key={participants.map((p) => p.id).join("-")} // reset when participants change
        nodes={nodes}
        edges={edges}
        nodeTypes={{ customNode: CustomNode }}
        fitView
      />
    );

};

export default BracketDisplay;