import React, { useState } from "react";
import { 
  Heading, Text, Button, Card, CardBody, 
  HStack, Input, IconButton, Box, 
  VStack
} from "@chakra-ui/react";
import { apiFetch } from "../../lib/api";
import { CategoryFull, Event } from "../../types/models";
import { ApiResponse } from "../../types/common";
import { useAuth } from "../../context/AuthContext";
import { FiX } from "react-icons/fi";
import { useEvent } from "../../context/EventContext";

type Props = {
  isOrganizer: boolean
};

const EventCategories: React.FC<Props> = ({ isOrganizer }) => {
  const { event, refreshEvent } = useEvent()
  const { token } = useAuth();
  const [newCategory, setNewCategory] = useState("");

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const order = (event?.categories?.length ?? 0) + 1
    try {
      const res = await apiFetch<ApiResponse<CategoryFull>>(
        `/api/events/${event?.id}/categories`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newCategory, order:order }),
        }
      );

      if (res.success) {
        setNewCategory("");
        refreshEvent();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCategory = async (categoryId: number) => {
    try {
      const res = await apiFetch<ApiResponse<{}>>(
        `/api/events/${event?.id}/categories/${categoryId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.success) {
        refreshEvent();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card.Root>
      <CardBody>
        <Heading size="md" mb={2}>Categories</Heading>
        <Text mb={4}>Manage categories for this event</Text>
        {
          isOrganizer &&
          <HStack mb={4}>
            <Input
              placeholder="New category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Button colorScheme="blue" onClick={addCategory} disabled={newCategory===""}>
              Add
            </Button>
          </HStack>
        }

        <VStack align='stretch' gap={3}>
          {event?.categories.map((cat) => (
            <Box key={cat.id} p={2} borderWidth="1px" rounded="md">
              <HStack justify="space-between">
                <Text>{cat.name}</Text>
                {
                  isOrganizer &&
                  <IconButton
                    aria-label="Delete category"
                    size="sm"
                    variant={'outline'}
                    rounded={'full'}
                    onClick={() => deleteCategory(cat.id)}
                  >
                      <FiX />
                  </IconButton>
                }
              </HStack>
            </Box>
          ))}
        </VStack>

        
      </CardBody>
    </Card.Root>
  );
};

export default EventCategories;
