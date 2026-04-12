import { Stack, Text, Title } from "@mantine/core";
import "./AuthShell.css";

interface AuthShellProps {
  children: React.ReactNode;
  description: string;
  footer: React.ReactNode;
  title: string;
}

const featureCopy = [
  "Supabase session handling with durable route guards",
  "Email auth plus Google and GitHub OAuth",
  "Dark-first experience with a clean black and purple system",
];

export function AuthShell({ children, description, footer, title }: AuthShellProps) {
  return (
    <div className="authShell">
      <div className="authShellGrid">
        <section className="authShellBrand">
          <div>
            <span className="authShellEyebrow">Upright</span>
            <Stack gap="md">
              <Title order={1}>Modern auth, without the spaghetti.</Title>
              <Text c="dimmed" maw={440}>
                The app shell now treats authentication, routing, errors, and themeing as first-class
                platform concerns instead of scattered page logic.
              </Text>
            </Stack>
          </div>

          <div className="authShellFeatureList">
            {featureCopy.map((item) => (
              <div className="authShellFeatureItem" key={item}>
                <span aria-hidden="true" className="authShellFeatureDot" />
                <Text>{item}</Text>
              </div>
            ))}
          </div>
        </section>

        <section className="authShellCard">
          <Stack gap="sm" mb="xl">
            <Title order={2}>{title}</Title>
            <Text c="dimmed">{description}</Text>
          </Stack>
          {children}
          <div className="authShellFooter">{footer}</div>
        </section>
      </div>
    </div>
  );
}
