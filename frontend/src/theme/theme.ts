import { Button, Paper, TextInput, PasswordInput, createTheme } from "@mantine/core";

/**
 * Creates a custom mantine theme by defining overrides
 * on top of the default mantine theme
 */
const theme = createTheme({
  black: "#0c0c0e",
  colors: {
    grape: [
      "#f4ebff",
      "#e5d2ff",
      "#cfb0ff",
      "#b88cff",
      "#a168ff",
      "#8f4dff",
      "#7c3aed",
      "#6728c7",
      "#531f9f",
      "#401879",
    ],
  },
  components: {
    Button: Button.extend({
      defaultProps: {
        color: "grape",
        radius: "md",
      },
      styles: (theme, { variant, color }) => {
        const grapeFilled = variant === "filled" && (color === "grape" || color === undefined);

        if (grapeFilled) {
          return {
            root: {
              "&::before": {
                backgroundColor: "rgba(255, 255, 255, 0.12)",
              },
              "&:hover:not(:disabled):not([dataDisabled])": {
                backgroundColor: theme.colors.grape[4],
              },
            },
          };
        }

        if (variant === "default") {
          return {
            root: {
              "&:hover:not(:disabled):not([dataDisabled])": {
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderColor: "rgba(255, 255, 255, 0.14)",
                color: "#f4f4f5",
              },
            },
          };
        }

        return {};
      },
    }),
    Paper: Paper.extend({
      defaultProps: {
        radius: "xl",
      },
    }),
    PasswordInput: PasswordInput.extend({
      defaultProps: {
        radius: "md",
        size: "md",
      },
    }),
    TextInput: TextInput.extend({
      defaultProps: {
        radius: "md",
        size: "md",
      },
    }),
  },
  cursorType: "pointer",
  defaultRadius: "md",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  headings: {
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  primaryColor: "grape",
});

export default theme;
