import React, { useEffect, useState, useMemo } from "react";
import { Box, Spinner, Text, VStack } from "@chakra-ui/react";
import { ReactFlow, Node, Edge } from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import { computeNodePositions, generateBracket, SeededParticipant, MatchBracket } from "./BracketDisplay";
import { apiFetch } from "../../lib/api";
import { ApiResponse } from "../../types/common";
import CustomNode from "./CustomNode";

interface BracketViewerProps {
  categoryId: number;
}

interface Res {
  matches: MatchBracket[][];
  participants: SeededParticipant[];
}

export const mapPositionsByMatchNumber = (
  mergedRounds: MatchBracket[][],
  positions: Record<number, { x: number; y: number }>
): Record<number, { x: number; y: number }> => {
  const flattened = mergedRounds.flat(); // MatchBracket[]
  const newPositions: Record<number, { x: number; y: number }> = {};

  flattened.forEach((match) => {
    if (!match.match_number) return; // skip matches without match_number
    const pos = positions[match.id]; // positions keyed by fake ID
    if (pos) {
      newPositions[match.match_number] = pos; // key by match_number
    }
  });

  return newPositions;
};

const BracketViewer: React.FC<BracketViewerProps> = ({ categoryId }) => {
  const [apiData, setApiData] = useState<Res | null>(null);
  const [loading, setLoading] = useState(true);

  // ---------------- Fetch API Data ----------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      apiFetch<ApiResponse<Res>>(`/api/events/categories/${categoryId}/bracket`)
        .then((r) => {
            if (r.success){
                console.log(r.data)
                setApiData(r.data);
            }
        });
      setLoading(false);
    };
    fetchData();
  }, [categoryId]);

  // ---------------- Generate visual bracket ----------------
  const visualBracket = useMemo(() => {
    if (!apiData?.participants) return [];
    return generateBracket(apiData.participants);
  }, [apiData]);

  // ---------------- Compute positions ----------------
    const nodePositions = useMemo(
        () => {
            return computeNodePositions(visualBracket ?? [], 250, 100)
        },[visualBracket]
    );

    const positionsByMatchNumber = mapPositionsByMatchNumber(visualBracket, nodePositions);

  // ---------------- Build nodes ----------------
  const nodes: Node[] = useMemo(() => {
    const result: Node[] = [];
    apiData?.matches.forEach((round) =>
        round.forEach((match) => {
            if (match.hidden) return; // skip hidden nodes entirely
            const pos = positionsByMatchNumber[match.match_number]
            if (!match.slots || match.slots.length === 0) {
                match.slots = [null, null];
            }
            match.slots.forEach((p, i) => {
                if (i < 2 && p) match.slots[i] = { ...p } as SeededParticipant;
            });

            result.push({
                id: match.id.toString(),
                position: { x: pos.x, y: pos.y },
                type: "customNode",
                data: { match },
            });
        })
    );
    return result;
}, [ positionsByMatchNumber, apiData]);

  // ---------------- Build edges ----------------
  const edges: Edge[] = useMemo(() => {
  const result: Edge[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  apiData?.matches.flat().forEach((match) => {
    if (!match.sourceIds || match.hidden) return; // skip hidden matches
    match.sourceIds.forEach((src) => {
      if (!nodeIds.has(src.toString()) || !nodeIds.has(match.id.toString())) return;
      result.push({
        id: `e${src}-${match.id}`,
        source: src.toString(),
        target: match.id.toString(),
      });
    });
  });

  return result;
}, [apiData, nodes]);

  if (loading || !apiData) return <Spinner size="xl" />;

  return (
    <Box width="100%" height="600px">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={{ customNode: CustomNode }}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll={false}
        panOnDrag
      />
    </Box>
  );
};

export default BracketViewer;
