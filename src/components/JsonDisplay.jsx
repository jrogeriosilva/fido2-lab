import { Box, IconButton, Snackbar, Alert } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

function JsonDisplay({ data, title = null, maxHeight = 400 }) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCopy = () => {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString);
    setSnackbarOpen(true);
  };

  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        {title && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ fontWeight: 600, color: 'primary.main' }}>{title}</Box>
            <IconButton size="small" onClick={handleCopy} title="Copy to clipboard">
              <ContentCopy fontSize="small" />
            </IconButton>
          </Box>
        )}
        {!title && (
          <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
            <IconButton
              size="small"
              onClick={handleCopy}
              title="Copy to clipboard"
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' }
              }}
            >
              <ContentCopy fontSize="small" />
            </IconButton>
          </Box>
        )}
        <Box
          sx={{
            borderRadius: 1,
            overflow: 'hidden',
            border: '1px solid rgba(144, 202, 249, 0.3)',
            maxHeight,
            overflowY: 'auto',
            '& pre': {
              margin: 0,
            }
          }}
        >
          <SyntaxHighlighter
            language="json"
            style={tomorrow}
            customStyle={{
              margin: 0,
              padding: '16px',
              fontSize: '0.875rem',
              backgroundColor: '#1d1f21',
            }}
          >
            {jsonString}
          </SyntaxHighlighter>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          Copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
}

export default JsonDisplay;
