import { useState } from "react";
import { Box,Input,Button,Heading,Stack,Field, Text} from "@chakra-ui/react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Toaster, toaster } from "../components/ui/toaster";
import { apiFetch } from "../lib/api";
import { LoginResponse } from "../types/auth";

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toaster.create({
        title: "Passwords do not match",
        description: "error",
        duration: 3000
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch<LoginResponse>("/api/auth/register", {
        method: "POST",
        headers:{
          'Content-Type': "application/json"
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.success) {
        const { access_token, user } = response.data
        login(access_token, user);
        toaster.create({
          title: "Registration successful",
          description: "Success",
          duration: 2000
        });
        navigate("/dashboard");
      } else {
        toaster.create({ title: "Error", description: "Error", duration: 2000 });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toaster.create({
          title: err.message,
          description: "error",
          duration: 3000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" h="100vh">
    <Toaster/>
      <Box w="sm" p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
        <Heading size="lg" mb={6} textAlign="center">
          Register
        </Heading>
        <form onSubmit={handleSubmit}>
          <Stack direction="column" gap={4}>
            <Field.Root>
              <Field.Label>Email</Field.Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Password</Field.Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Confirm Password</Field.Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Field.Root>

            <Button
              type="submit"
              colorScheme="blue"
              w="full"
              loading={loading}
            >
              Register
            </Button>

            <Text fontSize="sm" textAlign="center">
                Already have an account?{" "}
                <Link to="/login" style={{ color: "#3182ce", fontWeight: 500 }}>
                    Sign in here
                </Link>
            </Text>

          </Stack>
        </form>
      </Box>
    </Box>
  );
};