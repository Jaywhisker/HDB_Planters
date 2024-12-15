import React from "react";
import {
  GlobalStyles,
  CssBaseline,
  ThemeProvider as MuiThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material";

const rem = (px) => `${px / 16}rem`;

let appTheme = createTheme({
  typography: {
    fontFamily: '"Source Sans Pro", "Lato", sans-serif',
    h1: {
      fontFamily: '"Lato", sans-serif',
      fontWeight: 500,
      fontSize: 'clamp(2rem, 2.5vw + 1vh, 2.986rem)',
      lineHeight: 1.6,
    },
    h2: {
      fontFamily: '"Lato", sans-serif',
      fontWeight: 500,
      fontSize: 'clamp(2rem, 2vw + 1vh, 2.488rem)',
      lineHeight: 1.6,
    },
    h3: {
      fontFamily: '"Lato", sans-serif',
      fontWeight: 500,
      fontSize: 'clamp(1.75rem, 1.5vw + 1vh, 2.074rem)',
      lineHeight: 1.6,
    },
    h4: {
      fontFamily: '"Lato", sans-serif',
      fontWeight: 500,
      fontSize: 'clamp(1.5rem, 1.5vw + 0.5vh, 1.728rem)',
      lineHeight: 1.6,
    },
    h5: {
      fontFamily: '"Lato", sans-serif',
      fontWeight: 500,
      fontSize: "clamp(1.125rem, 2vw, 1.44rem)",
      lineHeight: 1.6,
    },
    h6: {
      fontFamily: '"Lato", sans-serif',
      fontWeight: 500,
      fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
      lineHeight: 1.6,
    },
    body1: {
      fontFamily: '"Source Sans Pro", sans-serif',
      fontWeight: 500,
      fontSize: 'clamp(1rem, 1.5vw + 0.5vh, 1.2rem)',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"Source Sans Pro", sans-serif',
      fontWeight: 500,
      fontSize: 'clamp(0.833rem, 1vw + 0.5vh, 1rem)',
      lineHeight: 1.6,
    },
    small: {
      fontFamily: '"Source Sans Pro", sans-serif',
      fontWeight: 500,
      fontSize: "clamp(0.7rem, 0.8vw, 0.833rem)",
      lineHeight: 1.6,
    },
    caption: {
      fontFamily: '"Source Sans Pro", sans-serif',
      fontWeight: 500,
      fontSize: "clamp(0.6rem, 0.7vw, 0.694rem)",
      lineHeight: 1.6,
    },
    button: {
      fontFamily: '"Source Sans Pro", sans-serif',
      fontWeight: 700,
      fontSize: "clamp(0.875rem, 1vw, 1rem)",
      lineHeight: 1.6,
      textTransform: "none",
    },
  },
  palette: {
    primary: {
      main: "rgba(36, 90, 62, 1)",
      dark: "#3E6E55",
    },
    secondary: {
      main: "rgba(28, 27, 27, 1)",
      container: "rgba(148,161,151, 1)",
    },
    background: {
      default: "rgba(252, 248, 247, 1)",
      paper: "rgba(235, 231, 230, 1)",
    },
    text: {
      primary: "rgba(28, 27, 27, 1)",
      secondary: "rgba(0, 0, 0, 0.6)",
      onPrimaryContainer: "rgba(255, 255, 255, 1)",
      onSecondaryContainer: "rgb(7, 18, 12, 1)",
    },
    surface: {
      container: {
        high: "rgba(235,231,230,1)",
        highest: "rgba(229,226,225,1)",
      },

      variant: {
        background: "#E0E3DE",
      },
    },
  },
  shape: {
    borderRadius: rem(8),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // Prevent uppercase text
          fontWeight: 600,
          borderRadius: "0.5rem",
          height: "2.5rem",
          padding:"calc(0.5vw) calc(1vw)", 
          "&:hover": {
            backgroundColor: "rgba(36, 90, 62, 0.8)", // Hover color (darker green)
          },
          "&:focus": {
            outline: "2px solid rgba(36, 90, 62, 0.5)", // Focus outline
            outlineOffset: "2px",
          },
          "&:active": {
            backgroundColor: "rgba(36, 90, 62, 0.6)", // Active color
          },
          "&.Mui-disabled": {
            backgroundColor: "rgba(36, 90, 62, 0.3)", // Disabled color
            color: "rgba(255, 255, 255, 0.5)", // Disabled text color
          },
        },
      },
      variants: [
        {
          props: { variant: "tonal" },
          style: {
            backgroundColor: "rgba(148, 161, 151, 1)",
            color: "rgba(28, 27, 27, 1)",
            borderRadius: rem(8),
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "rgba(128, 144, 134, 1)",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
            },
            "&:active": {
              backgroundColor: "rgba(118, 134, 124, 1)",
              boxShadow: "inset 0px 2px 4px rgba(0, 0, 0, 0.2)",
            },
            "&:focus": {
              outline: "2px solid rgba(128, 144, 134, 0.5)",
              outlineOffset: "2px",
            },
            "&.Mui-disabled": {
              backgroundColor: "rgba(148, 161, 151, 0.5)",
              color: "rgba(28, 27, 27, 0.3)",
            },
          },
        },
        {
          props: { variant: "contained" },
          style: {
            backgroundColor: "rgba(36, 90, 62, 1)", // Primary green
            color: "#fff",
            "&:hover": {
              backgroundColor: "rgba(33, 79, 55, 1)",
            },
          },
        },
        {
          props: { variant: "outlined" },
          style: {
            borderColor: "rgba(36, 90, 62, 1)", // Outline green
            color: "rgba(36, 90, 62, 1)",
            "&:hover": {
              backgroundColor: "rgba(36, 90, 62, 0.1)", // Light green background
              borderColor: "rgba(36, 90, 62, 0.8)", // Darker outline
            },
          },
        },
        {
          props: { variant: "text" },
          style: {
            color: "rgba(36, 90, 62, 1)",
            "&:hover": {
              backgroundColor: "rgba(36, 90, 62, 0.1)",
            },
          },
        },
      ],
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          "& .MuiSlider-rail": {
            backgroundColor: "#C8C6C5",
          },
          "& .MuiSlider-track": {
            height: 5,
          },
          "& .MuiSlider-thumb": {
            backgroundColor: "#4A7F61",
          },
          height: 5,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
          borderRadius: "5rem",
          padding: "0 0.5rem",
          "&.MuiChip-outlinedPrimary": {
            borderColor: "rgba(36, 90, 62, 0.8)",
            color: "rgba(36, 90, 62, 1)",
            backgroundColor: "rgba(36, 90, 62, 0.05)",
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Lato", sans-serif',
          fontSize: "1.25rem",
          fontWeight: 600,
          textAlign: "center",
          color: "rgba(36, 90, 62, 1)",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          fontFamily: '"Source Sans Pro", sans-serif',
          fontSize: "1rem",
          color: "rgba(28, 27, 27, 1)",
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          justifyContent: "space-evenly",
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          minWidth: 400,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          textAlign: "left",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#FCF8F7",
          borderRadius: "0.5rem",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", // Light shadow
          "& .MuiCardMedia-root": {
            borderTopLeftRadius: "0.5rem",
            borderTopRightRadius: "0.5rem",
          },
        },
      },
    },
  },
});

const globalScrollbarStyles = (
  <GlobalStyles
    styles={{
      "body": {
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(148, 161, 151, 1) rgba(235, 231, 230, 1)",
      },
      "body::-webkit-scrollbar": {
        width: "12px", 
      },
      "body::-webkit-scrollbar-thumb": {
        backgroundColor: "rgba(148, 161, 151, 1)",
        borderRadius: "10px",
        border: "3px solid rgba(235, 231, 230, 1)", 
      },
      "body::-webkit-scrollbar-track": {
        backgroundColor: "rgba(235, 231, 230, 1)",
        borderRadius: "10px",
      },
      "body::-webkit-scrollbar-thumb:hover": {
        backgroundColor: "rgba(128, 144, 134, 1)",
      },
    }}
  />
);

// Apply responsive font sizes
appTheme = responsiveFontSizes(appTheme);

export const ThemeProvider = ({ children }) => {
  return (
    <MuiThemeProvider theme={appTheme}>
      <CssBaseline />
      {globalScrollbarStyles}
      {children}
    </MuiThemeProvider>
  );
};
