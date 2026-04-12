import { Button, Paper, TextInput, PasswordInput, createTheme } from "@mantine/core";

const theme = createTheme({
  black: "#050409",
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
