// theme.js
import { createTheme } from '@mui/material/styles';

const primary = {
  main: '#9DB2BF',
  light: '#DDE6ED',
  dark: '#526D82',
  contrastText: '#27374D',
};

const theme = createTheme({
  palette: {
    primary: {
      main: primary.main,
      light: primary.light,
      dark: primary.dark,
      contrastText: primary.contrastText,
    },
    // Customize other palette options if needed
  },
  // Add other theme customizations here (typography, spacing, etc.).
});

export default theme;