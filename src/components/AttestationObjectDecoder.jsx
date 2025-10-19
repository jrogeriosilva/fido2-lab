import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Alert,
  Stack,
  Tooltip,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { parseAttestationObject } from '../utils/attestationParser';

function AttestationObjectDecoder() {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleDecode = () => {
    setError('');
    setParsed(null);

    if (!input.trim()) {
      setError('Please enter a base64url-encoded attestationObject');
      return;
    }

    try {
      const result = parseAttestationObject(input.trim());
      setParsed(result);
    } catch (err) {
      setError(`Failed to parse attestationObject: ${err.message}`);
      console.error('Parse error:', err);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleInputChange = (value) => {
    setInput(value);
    setError('');
  };

  const renderFlagChip = (label, value) => (
    <Chip
      label={label}
      size="small"
      color={value ? 'success' : 'default'}
      sx={{ fontFamily: 'monospace', minWidth: 40 }}
    />
  );

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
          <Box sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Base64URL-Encoded AttestationObject</Box>
        </Box>
        <TextField
          fullWidth
          multiline
          rows={6}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Paste base64url-encoded attestationObject here..."
          variant="outlined"
        />
      </Box>

      {/* Decode Button */}
      <Button
        variant="contained"
        onClick={handleDecode}
        fullWidth
        sx={{ mb: 3 }}
      >
        🔍 Decode AttestationObject
      </Button>

      {/* Parsed Output */}
      {parsed && (
        <Stack spacing={2}>
          {/* Format */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Attestation Format
            </Typography>
            <Chip label={parsed.fmt} color="primary" />
          </Paper>

          {/* Authenticator Data */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Authenticator Data
            </Typography>

            {/* RP ID Hash */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                RP ID Hash:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {parsed.authData.rpIdHash}
              </Typography>
            </Box>

            {/* Flags */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Flags ({parsed.authData.flagsByte}):
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {renderFlagChip('UP', parsed.authData.flags.UP)}
                {renderFlagChip('UV', parsed.authData.flags.UV)}
                {renderFlagChip('BE', parsed.authData.flags.BE)}
                {renderFlagChip('BS', parsed.authData.flags.BS)}
                {renderFlagChip('AT', parsed.authData.flags.AT)}
                {renderFlagChip('ED', parsed.authData.flags.ED)}
              </Stack>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                UP=User Present, UV=User Verified, BE=Backup Eligible, BS=Backup State, AT=Attested Credential Data, ED=Extension Data
              </Typography>
            </Box>

            {/* Sign Count */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Sign Count: <Chip label={parsed.authData.signCount} size="small" />
              </Typography>
            </Box>

            {/* Attested Credential Data */}
            {parsed.authData.attestedCredentialData && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Attested Credential Data:
                </Typography>

                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>AAGUID:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {parsed.authData.attestedCredentialData.aaguid}
                  </Typography>
                </Box>

                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Credential ID (hex):</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                    {parsed.authData.attestedCredentialData.credentialId}
                  </Typography>
                </Box>

                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Credential ID (base64url):</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                    {parsed.authData.attestedCredentialData.credentialIdBase64url}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Credential Public Key (COSE):</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {JSON.stringify(parsed.authData.attestedCredentialData.credentialPublicKey, null, 2)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Extensions */}
            {parsed.authData.extensions && (
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Extensions:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(parsed.authData.extensions, null, 2)}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Attestation Statement */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Attestation Statement
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(parsed.attStmt, null, 2)}
            </Typography>
          </Paper>

          {/* Full JSON Output */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Complete JSON Structure
              </Typography>
              <Tooltip title={copySuccess ? "Copied!" : "Copy to clipboard"}>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(JSON.stringify(parsed, null, 2))}
                  color={copySuccess ? "success" : "default"}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={10}
              value={JSON.stringify(parsed, null, 2)}
              variant="outlined"
              InputProps={{
                readOnly: true,
                sx: { fontFamily: 'monospace', fontSize: '0.75rem' }
              }}
            />
          </Paper>
        </Stack>
      )}

      {/* Helper Text */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <strong>AttestationObject Structure:</strong> This CBOR-encoded object is returned during FIDO2 credential creation.
        It contains the attestation format, authenticator data (RP ID hash, flags, counter, credential data), and attestation statement.
      </Alert>
    </Box>
  );
}

export default AttestationObjectDecoder;
