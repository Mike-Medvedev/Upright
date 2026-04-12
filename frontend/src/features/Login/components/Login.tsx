import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Divider,
  Stack,
  Anchor,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAuth } from "@/infra/auth/auth.context";
import { useNavigate } from "react-router";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: { email: "", password: "" },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : "Invalid email"),
      password: (v) => (v.length < 6 ? "Password too short" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    await login({ type: "email", credentials: values });
    navigate("/home");
  };

  const handleGoogle = async () => {
    await login({ type: "oauth", credentials: { provider: "google" } });
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Paper w={400} p="xl" withBorder radius="md">
        <Title order={2} mb={4}>
          Welcome back
        </Title>
        <Text c="dimmed" size="sm" mb="lg">
          Sign in to your account
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="you@example.com"
              {...form.getInputProps("email")}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              {...form.getInputProps("password")}
            />
            <Button type="submit" fullWidth>
              Sign in
            </Button>
          </Stack>
        </form>

        <Divider label="or" labelPosition="center" my="md" />

        <Button fullWidth variant="default" onClick={handleGoogle}>
          Continue with Google
        </Button>

        <Text ta="center" size="sm" mt="md">
          No account? <Anchor href="/signup">Sign up</Anchor>
        </Text>
      </Paper>
    </div>
  );
}
