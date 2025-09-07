import React from "react";
import { VStack, Box, Text, HStack, IconButton } from "@chakra-ui/react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { JoinRequest } from "../../types/enpoints";
import { FiX, FiCheck } from "react-icons/fi";
import { useToastContext } from "../../context/ToastContext";
import { useEvent } from "../../context/EventContext";

interface RequestListProps {
  requests: JoinRequest[];
}

const RequestList: React.FC<RequestListProps> = ({requests}) => {
  const { token } = useAuth();
  const { createToast } = useToastContext()
  const { event, refreshEvent} = useEvent()

  const handleAction = async (requestId: number, action: "accepted" | "rejected") => {
    console.log(action)
    try {
      const res = await apiFetch<ApiResponse<{message:string}>>(
        `/api/events/${event?.id}/join-requests/${requestId}/${action}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.success) {
        // Ideally trigger a refetch via state lifting or context
        console.log(`${action} success`, res.data);
        createToast({
          title: 'Success',
          description: res.data.message,
          type: 'info'
        })
        refreshEvent()
      }
    } catch (err) {
      console.error(`${action} failed`, err);
      createToast({
          title: 'Error',
          description: "Something went wrong",
          type: 'error'
        })
    }
  };

  return (
    <VStack align="stretch" gap={2}>
      {requests.map((r) => (
        <Box key={r.id} p={2} borderWidth="1px" rounded="md">
          <HStack justify="space-between">
            <Text>{r.club.name}</Text>
            <HStack>
                <IconButton rounded={'full'} variant={'outline'} size='sm' onClick={() => handleAction(r.id, "accepted")}>
                    <FiCheck />
                </IconButton>
                <IconButton rounded={'full'} variant={'outline'} size='sm' onClick={() => handleAction(r.id, "rejected")}>
                    <FiX />
                </IconButton>
            </HStack>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
};

export default RequestList;
