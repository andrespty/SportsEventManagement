import React from "react";
import {Box, Button } from "@chakra-ui/react";
import { useAuth } from "../../context/AuthContext";
import { canAccess } from "../../utils/canAccess";
import { UserRoles } from "../../types/auth.d";
import ManagerBoard from "./ManagerBoard";
import ClubOwnerBoard from "./ClubOwnerBoard";
// import {UserRoles} from "../../types/auth";

export const Dashboard: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <Box p={6}>
      {
        canAccess(user, { roles: [UserRoles.MANAGER]}) && <ManagerBoard />
      }
      {
        canAccess(user, { owner: true}) && <ClubOwnerBoard />
      }
      <Button mt={4} colorScheme="red" onClick={logout}>
        Logout
      </Button>
    </Box>
  );
};