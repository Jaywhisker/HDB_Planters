import {
    CssBaseline,
    ThemeProvider as MuiThemeProvider,
    createTheme,
  } from "@mui/material";
  import React from "react";
  
  const rem = (px) => `${px / 16}rem`;
  
  const appTheme = createTheme({
    typography: {
      h1: {
        fontFamily: '"Lora", serif',
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
      },
      h2: {
        fontFamily: '"Lora", serif',
        fontWeight: 700,
        fontSize: '2rem',
        lineHeight: 1.3,
      },
      h3: {
        fontFamily: '"Lora", serif',
        fontWeight: 700,
        fontSize: '1.75rem',
        lineHeight: 1.4,
      },
      titleprominent:{
        fontFamily: '"Source Sans Pro", sans-serif',
        fontSize: '1rem',
        fontWeight: 900,
        lineHeight: 1.6,
      },
      // Customize for Source Sans Pro as well for body1, body2, etc.
      body1: {
        fontFamily: '"Source Sans Pro", sans-serif',
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      bodymedium: {
        fontFamily: '"Source Sans Pro", sans-serif',
        fontSize: '0.875rem',
        lineHeight: 1.3,
      },
    },
    palette: {
      primary: {
        main: "rgba(36, 90, 62, 1)",
      },
      secondary: {
        main: "rgba(28, 27, 27, 1)",
        container: "rgba(148,161,151, 1)"
      },
      background: {
        default: "rgba(252, 248, 247, 1)",
        paper: "rgba(235, 231, 230, 1)",
      },
      text: {
        primary: "rgba(28, 27, 27, 1)",
        secondary: "rgba(196, 199, 195, 1)",
        onSecondaryContainer:"rgb(7, 18, 12, 1)",
      },
      surface: {
        container: {
          high: "rgba(235,231,230,1)",
        }
      }
    },
    typography: {
      fontFamily: "Source Sans Pro, Helvetica",
      h1: {
        fontSize: rem(45),
        fontWeight: 400,
        lineHeight: rem(52),
      },
      h2: {
        fontSize: rem(22),
        fontWeight: 400,
        lineHeight: rem(27),
      },
      body1: {
        fontSize: rem(16),
        fontWeight: 400,
        lineHeight: rem(24),
      },
      button: {
        fontSize: rem(14),
        fontWeight: 600,
        lineHeight: rem(20),
        textTransform: "none",
      },
    },
    shape: {
      borderRadius: rem(8),
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: rem(12),
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: rem(16),
          },
        },
      },
      MuiCardActions: {
        styleOverrides: {
          root: {
            padding: rem(16),
          },
        },
      },
    },
  });
  
  export const ThemeProvider = ({ children }) => {
    return (
      <MuiThemeProvider theme={appTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    );
  };
  