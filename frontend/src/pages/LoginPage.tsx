import { useAuth } from "../context/AuthContext";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, Input, Button, Heading, Stack, Field, Text } from "@chakra-ui/react";
import { Toaster, toaster } from "../components/ui/toaster";
import { apiFetch } from "../lib/api";
import { LoginResponse } from "../types/auth";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        // Mock API request (replace with your backend URL)
        const result = await apiFetch<LoginResponse>("/api/auth/login", {
            method: "POST",
            headers:{
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password}),
            credentials: "include"
        })
        console.log(result)
        if (result.success){
            const { access_token, user } = result.data
            login(access_token, user);
            toaster.create({ title: "Login successful", description: "success", duration: 2000 });
            navigate("/dashboard");
        }
        else {
            toaster.create({ title: "Error", description: "Error", duration: 2000 });
        }
    } 
    finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" h="100vh">
    <Toaster />
      <Box w="sm" p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
        <Heading size="lg" mb={6} textAlign="center">Login</Heading>
        <form onSubmit={handleSubmit}>
          <Stack direction='column' gap={4}>
            <Field.Root>
              <Field.Label>Email</Field.Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field.Root>

            <Field.Root>
              <Field.Label>Password</Field.Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field.Root>

            <Button type="submit" colorScheme="blue" w="full" loading={loading}>
              Login
            </Button>

            <Text fontSize="sm" textAlign="center">
                Don’t have an account?{" "}
                <Link to="/register" style={{ color: "#3182ce", fontWeight: 500 }}>
                    Register here
                </Link>
            </Text>
          </Stack>
        </form>
      </Box>
    </Box>
  );
};