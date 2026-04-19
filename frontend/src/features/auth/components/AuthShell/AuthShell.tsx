import { Stack, Text, Title } from "@mantine/core";
import { AppLogo } from "@/theme/components/AppLogo/AppLogo";
import "@/features/auth/components/AuthShell/AuthShell.css";

interface AuthShellProps {
  children: React.ReactNode;
  description: string;
  footer: React.ReactNode;
  title: string;
}

export function AuthShell({ children, description, footer, title }: AuthShellProps) {
  return (
    <div className="authShell">
      <div className="authShellCenter">
        <section className="authShellCard">
          <Stack gap="lg" mb="xl">
            <div className="authShellBrand">
              <AppLogo />
              <Title className="authShellProductName" order={1}>
                Upright
              </Title>
            </div>
            <Stack gap="sm">
              <Title order={2}>{title}</Title>
              <Text c="dimmed">{description}</Text>
            </Stack>
          </Stack>
          {children}
          <div className="authShellFooter">{footer}</div>
        </section>
      </div>
    </div>
  );
}
