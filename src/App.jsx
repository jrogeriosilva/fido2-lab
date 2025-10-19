import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CreateCredentialForm from './components/CreateCredentialForm';
import SigningPanel from './components/SigningPanel';
import AssertionDisplay from './components/AssertionDisplay';
import ModeSelector from './components/ModeSelector';
import KeyGeneratorButton from './components/KeyGeneratorButton';
import CredentialManager from './components/CredentialManager';
import Base64Decoder from './components/Base64Decoder';
import AttestationObjectDecoder from './components/AttestationObjectDecoder';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff',
    },
    secondary: {
      main: '#888888',
    },
    background: {
      default: '#000000',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#888888',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    error: {
      main: '#f44336',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.02))',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
        },
      },
    },
  },
});

function App() {
  const [mode, setMode] = useState('simulated'); // 'simulated' or 'hardware'
  const [assertion, setAssertion] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  const handleCredentialCreated = () => {
    // Trigger refresh of credential list
    setRefreshKey(prev => prev + 1);
  };

  const handleAssertionGenerated = (assertionData) => {
    setAssertion(assertionData);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar sx={{ py: 1.5 }}>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 700, letterSpacing: 0.5 }}>
              🧪 FIDO2 Lab
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3 } }}>
          {/* Chrome-style Tabs integrated with content */}
          <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'transparent', boxShadow: 'none', backgroundImage: 'none' }}>
            {/* Tabs header */}
            <Box sx={{ bgcolor: 'transparent', px: 1, pt: 1 }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  minHeight: 40,
                  '& .MuiTabs-indicator': {
                    display: 'none',
                  },
                  '& .MuiTab-root': {
                    minHeight: 40,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    marginRight: 0.5,
                    color: '#666',
                    bgcolor: '#0a0a0a',
                    border: 'none',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#1a1a1a',
                      color: '#fff',
                    },
                    '&.Mui-selected': {
                      color: '#fff',
                      bgcolor: '#1a1a1a',
                      borderBottom: 'none',
                    },
                  },
                }}
              >
                <Tab label="➕ Create Credentials" />
                <Tab label="✍️ Fido-Sign" />
                <Tab label="🔤 Base64 Tool" />
                <Tab label="🔍 Attestation Decoder" />
                <Tab label="⚙️ Settings" />
              </Tabs>
            </Box>

            {/* Tab Content - integrated without margin */}
            <Box sx={{ p: 2, bgcolor: '#1a1a1a', borderTop: 'none', borderRadius: 2 }}>
              {activeTab === 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                  </Typography>
                  <CreateCredentialForm
                    mode={mode}
                    onCredentialCreated={handleCredentialCreated}
                  />
                </>
              )}

              {activeTab === 1 && (
                <>
                  <Typography variant="h6" gutterBottom>
                  </Typography>
                  <SigningPanel
                    mode={mode}
                    refreshKey={refreshKey}
                    onAssertionGenerated={handleAssertionGenerated}
                  />
                </>
              )}

              {activeTab === 2 && (
                <>
                  <Typography variant="h6" gutterBottom>
                  </Typography>
                  <Base64Decoder />
                </>
              )}

              {activeTab === 3 && (
                <>
                  <Typography variant="h6" gutterBottom>
                  </Typography>
                  <AttestationObjectDecoder />
                </>
              )}

              {activeTab === 4 && (
                <>
                  <Typography variant="h6" gutterBottom>
                  </Typography>
                  
                  {/* Authentication Mode */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Authentication Mode
                    </Typography>
                    <ModeSelector mode={mode} onChange={setMode} />
                  </Box>

                  {/* Key Generator (only for simulated mode) */}
                  {mode === 'simulated' && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        🔑 Key Generator
                      </Typography>
                      <KeyGeneratorButton onKeyGenerated={handleCredentialCreated} />
                    </Box>
                  )}

                  {/* Stored Credentials (Collapsible) */}
                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="credentials-content"
                      id="credentials-header"
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        💾 Stored Credentials
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <CredentialManager refreshKey={refreshKey} />
                    </AccordionDetails>
                  </Accordion>
                </>
              )}
            </Box>
          </Paper>

          {/* Assertion Display - separate card below */}
          {activeTab === 1 && assertion && (
            <Paper elevation={8} sx={{ p: 3, mt: 3, borderRadius: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <Typography variant="h6" gutterBottom>
                ✅ Generated Assertion
              </Typography>
              <AssertionDisplay assertion={assertion} />
            </Paper>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
