import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Alert,
  Stack,
  Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { base64url } from '../utils/crypto';

function Base64Decoder() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState({ input: false, output: false });

  const handleDecode = () => {
    setError('');

    if (!input.trim()) {
      setError('Please enter base64url encoded text to decode');
      return;
    }

    try {
      // Decode base64url to buffer
      const buffer = base64url.decode(input.trim());

      // Convert buffer to UTF-8 text
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(buffer);

      setOutput(text);
    } catch (err) {
      setError('Invalid base64url input. Please check your input and try again.');
      console.error('Decode error:', err);
    }
  };

  const handleEncode = () => {
    setError('');

    if (!input.trim()) {
      setError('Please enter text to encode');
      return;
    }

    try {
      // Convert UTF-8 text to buffer
      const encoder = new TextEncoder();
      const buffer = encoder.encode(input.trim());

      // Encode buffer to base64url
      const encoded = base64url.encode(buffer);

      setOutput(encoded);
    } catch (err) {
      setError('Failed to encode text. Please try again.');
      console.error('Encode error:', err);
    }
  };

  const handleSwap = () => {
    const temp = input;
    setInput(output);
    setOutput(temp);
    setError('');
  };

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess({ ...copySuccess, [field]: true });
      setTimeout(() => {
        setCopySuccess({ ...copySuccess, [field]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleInputChange = (value) => {
    setInput(value);
    setError(''); // Clear error when user types
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Input Field */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Input</Box>
          {input && (
            <Tooltip title={copySuccess.input ? "Copied!" : "Copy to clipboard"}>
              <IconButton
                size="small"
                onClick={() => handleCopy(input, 'input')}
                color={copySuccess.input ? "success" : "default"}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <TextField
          fullWidth
          multiline
          rows={6}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Enter text to encode or base64url to decode..."
          variant="outlined"
        />
      </Box>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={handleDecode}
          sx={{ flex: 1 }}
        >
          ⬇️ Decode (Base64URL → Text)
        </Button>

        <Tooltip title="Swap input and output">
          <IconButton
            onClick={handleSwap}
            disabled={!input && !output}
            color="primary"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            <SwapVertIcon />
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          onClick={handleEncode}
          sx={{ flex: 1 }}
        >
          ⬆️ Encode (Text → Base64URL)
        </Button>
      </Stack>

      {/* Output Field */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Output</Box>
          {output && (
            <Tooltip title={copySuccess.output ? "Copied!" : "Copy to clipboard"}>
              <IconButton
                size="small"
                onClick={() => handleCopy(output, 'output')}
                color={copySuccess.output ? "success" : "default"}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <TextField
          fullWidth
          multiline
          rows={6}
          value={output}
          placeholder="Result will appear here..."
          variant="outlined"
          InputProps={{
            readOnly: true,
          }}
        />
      </Box>

      {/* Helper Text */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <strong>Base64URL Format:</strong> This tool uses base64url encoding (RFC 4648),
        which replaces <code>+</code> with <code>-</code> and <code>/</code> with <code>_</code>,
        and omits padding <code>=</code> characters. This is the format used by FIDO2/WebAuthn.
      </Alert>
    </Box>
  );
}

export default Base64Decoder;
