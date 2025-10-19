import { Dialog, DialogTitle, DialogContent, Typography, Box, IconButton, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ModeSelector from './ModeSelector';
import KeyGeneratorButton from './KeyGeneratorButton';
import CredentialManager from './CredentialManager';

function SettingsDialog({ open, onClose, mode, onModeChange, onKeyGenerated, refreshKey }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          ⚙️ Settings
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {/* Authentication Mode */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Authentication Mode
          </Typography>
          <ModeSelector mode={mode} onChange={onModeChange} />
        </Box>

        {/* Key Generator (only for simulated mode) */}
        {mode === 'simulated' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              🔑 Key Generator
            </Typography>
            <KeyGeneratorButton onKeyGenerated={onKeyGenerated} />
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
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;
