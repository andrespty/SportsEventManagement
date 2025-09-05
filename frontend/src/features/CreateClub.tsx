import React, { useState } from "react";
import { Box, Input, List, ListItem, Button, Text, HStack, useDisclosure, Dialog, Portal, CloseButton, Stack, Avatar, Heading, Field, Tag} from "@chakra-ui/react";
import { Club, User } from "../types/models";
import { apiFetch } from "../lib/api";
import { ApiResponse } from "../types/common";
import { useAuth } from "../context/AuthContext";
import { toaster, Toaster } from "../components/ui/toaster";

interface CreateClubProps {
  users: User[];
}
const rolePalettes: Record<string, string> = {
  manager: "purple",
  user: "pink",
  admin: "green",
};


export const CreateClub: React.FC<CreateClubProps> = ({ users }) => {
  const [search, setSearch] = useState("");
  const [clubName, setClubName] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { open, onOpen, onClose } = useDisclosure();
  const { token } = useAuth();

  // Filter users based on search input
  const filteredUsers = users.filter((user) =>
    [user.email || ""].some((field) =>
      field.toLowerCase().includes(search.toLowerCase())
    )
  );

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleClose = () => {
    setSelectedUser(null);
    setClubName("");
    onClose();
  };

  const createClub = async () => {
    if (!clubName.trim()) return;

    try {
      if (selectedUser) {
        const result = await apiFetch<ApiResponse<Club>>("/api/clubs/", {
          method: "POST",
          body: JSON.stringify({ name: clubName, owner_id: selectedUser.id }),
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (result.success) {
          toaster.create({
            title: "Club created 🎉",
            description: `${clubName} has been created with ${selectedUser.email} as owner.`,
            duration: 4000
          });
          handleClose();
        } else {
          toaster.create({
            title: "Error creating club",
            description: result.error || "Please try again.",
            duration: 4000
          });
        }
      }
    } catch (err) {
      toaster.create({
        title: "Network error",
        description: "Failed to connect to the server.",
        duration: 4000
      });
    }
  };

  return (
    <Box p={6}>
      <Toaster />
      <Heading size="md" mb={4}>
        Create a Club
      </Heading>

      <Input
        placeholder="Search users by email or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        mb={4}
      />

      {/* <Divider mb={4} /> */}

      <List.Root>
        {filteredUsers.map((user) => (
          <ListItem
            key={user.id}
            p={3}
            my={2}
            borderWidth={1}
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            cursor="pointer"
            _hover={{ bg: "gray.50" }}
            onClick={() => handleUserClick(user)}
          >
            <Stack direction="row" align="center">
              <Avatar.Root size="sm" >
                <Avatar.Fallback name={user.email} />
              </Avatar.Root>
              <Box>
                <Text fontWeight="semibold">{user.email}</Text>
                <HStack>
                  <Tag.Root colorPalette={rolePalettes[user.role] || "gray"}>
                    <Tag.Label>{user.role}</Tag.Label>
                  </Tag.Root>
                  {
                    user.isOwner && 
                    <Tag.Root colorPalette={'blue'}>
                      <Tag.Label>Owner</Tag.Label>
                    </Tag.Root>
                  }
                </HStack>
              </Box>
            </Stack>
            <Button size="sm" variant="outline" colorScheme="blue">
              Select
            </Button>
          </ListItem>
        ))}
        {filteredUsers.length === 0 && (
          <Box textAlign="center" py={6} color="gray.500">
            No users found.
          </Box>
        )}
      </List.Root>

      {/* Dialog */}
      {selectedUser && (
        <Dialog.Root open={open} onOpenChange={handleClose}>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content borderRadius="lg" p={4}>
                <Dialog.Header>
                  <Dialog.Title>Create Club</Dialog.Title>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton size="sm" />
                  </Dialog.CloseTrigger>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap={4}>
                    <Box p={3} borderWidth={1} borderRadius="md" bg="gray.50">
                      <Stack direction="row" align="center" gap={3}>
                        <Avatar.Root size="sm" >
                          <Avatar.Fallback name={selectedUser.email} />
                        </Avatar.Root>
                        <Box>
                          <Text fontWeight="bold">{selectedUser.email}</Text>
                          <HStack>
                            <Tag.Root colorPalette={rolePalettes[selectedUser.role] || "gray"}>
                              <Tag.Label>{selectedUser.role}</Tag.Label>
                            </Tag.Root>
                            {
                              selectedUser.isOwner && 
                              <Tag.Root colorPalette={'blue'}>
                                <Tag.Label>Owner</Tag.Label>
                              </Tag.Root>
                            }
                          </HStack>
                        </Box>
                      </Stack>
                    </Box>

                    <Field.Root>
                      <Field.Label>Club Name</Field.Label>
                      <Input
                        placeholder="Elite Academy"
                        value={clubName}
                        onChange={(e) => setClubName(e.target.value)}
                      />
                      {/* {!clubName.trim() && (
                        <Field.ErrorText>Club name is required.</Field.ErrorText>
                      )} */}
                    </Field.Root>
                  </Stack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Stack direction="row" gap={3}>
                    <Button onClick={handleClose} variant="ghost">
                      Cancel
                    </Button>
                    <Button
                      colorScheme="blue"
                      onClick={createClub}
                      disabled={!clubName.trim()}
                    >
                      Create
                    </Button>
                  </Stack>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
    </Box>
  );
};
