import { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Chip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Delete, Visibility, ContentCopy } from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getCredentials, deleteCredential, clearAllCredentials } from '../utils/localStorage';

function CredentialManager({ refreshKey }) {
  const [credentials, setCredentials] = useState([]);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, [refreshKey]);

  const loadCredentials = () => {
    const creds = getCredentials();
    setCredentials(creds);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this credential?')) {
      deleteCredential(id);
      loadCredentials();
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete ALL credentials?')) {
      clearAllCredentials();
      loadCredentials();
    }
  };

  const handleView = (credential) => {
    setSelectedCredential(credential);
    setDialogOpen(true);
  };

  const handleCopy = (credential) => {
    navigator.clipboard.writeText(JSON.stringify(credential, null, 2));
  };

  return (
    <Box>
      {credentials.length === 0 ? (
        <Alert severity="info">No credentials stored yet. Create one to get started.</Alert>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {credentials.length} credential{credentials.length !== 1 ? 's' : ''} stored
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          </Box>

          <List>
            {credentials.map((credential) => (
              <ListItem
                key={credential.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: 1,
                  mb: 1,
                }}
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="view"
                      onClick={() => handleView(credential)}
                      sx={{ mr: 1 }}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="copy"
                      onClick={() => handleCopy(credential)}
                      sx={{ mr: 1 }}
                    >
                      <ContentCopy />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(credential.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">
                        {credential.userName || credential.userId || 'Unknown User'}
                      </Typography>
                      <Chip
                        label={credential.type}
                        size="small"
                        color={credential.type === 'simulated' ? 'secondary' : 'primary'}
                      />
                      <Chip
                        label={credential.algorithm}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        ID: {credential.id.substring(0, 16)}...
                      </Typography>
                      <br />
                      <Typography variant="body2" component="span">
                        Created: {new Date(credential.createdAt).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.02))',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{
          fontWeight: 600,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pb: 2
        }}>
          Credential Details
        </DialogTitle>
        <DialogContent sx={{
          pt: 3,
          '& pre': {
            margin: 0
          }
        }}>
          {selectedCredential && (
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: '#000000',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {JSON.stringify(selectedCredential, null, 2)}
            </SyntaxHighlighter>
          )}
        </DialogContent>
        <DialogActions sx={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          pt: 2,
          px: 3,
          pb: 2
        }}>
          <Button
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CredentialManager;
