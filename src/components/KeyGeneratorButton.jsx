import { useState } from 'react';
import {
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Alert,
  Collapse,
  Typography,
  Paper,
  IconButton
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, ContentCopy, Delete } from '@mui/icons-material';
import { generateKeyPairForStorage } from '../utils/fido2Simulator';
import { saveGeneratedKey, getGeneratedKeys, deleteGeneratedKey } from '../utils/localStorage';

function KeyGeneratorButton({ onKeyGenerated }) {
  const [algorithm, setAlgorithm] = useState('ES256');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [generatedKeys, setGeneratedKeys] = useState([]);
  const [showKeys, setShowKeys] = useState(false);

  const handleGenerateKey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const keyPair = await generateKeyPairForStorage(algorithm);
      const saved = saveGeneratedKey(keyPair);

      if (saved) {
        setSuccess(`Key pair generated successfully (${algorithm})`);
        loadGeneratedKeys();
        if (onKeyGenerated) {
          onKeyGenerated();
        }
      } else {
        setError('Failed to save generated key pair');
      }
    } catch (err) {
      setError(`Error generating key pair: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadGeneratedKeys = () => {
    const keys = getGeneratedKeys();
    setGeneratedKeys(keys);
  };

  const handleCopyKey = (keyData) => {
    navigator.clipboard.writeText(JSON.stringify(keyData, null, 2));
  };

  const handleDeleteKey = (keyId) => {
    const success = deleteGeneratedKey(keyId);
    if (success) {
      loadGeneratedKeys();
      if (onKeyGenerated) {
        onKeyGenerated();
      }
    }
  };

  const toggleShowKeys = () => {
    if (!showKeys) {
      loadGeneratedKeys();
    }
    setShowKeys(!showKeys);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="algorithm-select-label">Algorithm</InputLabel>
          <Select
            labelId="algorithm-select-label"
            value={algorithm}
            label="Algorithm"
            onChange={(e) => setAlgorithm(e.target.value)}
          >
            <MenuItem value="ES256">ES256 (ECDSA P-256)</MenuItem>
            <MenuItem value="RS256">RS256 (RSA 2048)</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateKey}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Key Pair'}
        </Button>

        <Button
          variant="outlined"
          onClick={toggleShowKeys}
          endIcon={showKeys ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        >
          {showKeys ? 'Hide' : 'Show'} Generated Keys
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Collapse in={showKeys}>
        <Paper variant="outlined" sx={{ p: 2, mt: 2, maxHeight: 400, overflow: 'auto', bgcolor: 'rgba(0,0,0,0.2)' }}>
          <Typography variant="subtitle1" gutterBottom>
            Generated Key Pairs ({generatedKeys.length})
          </Typography>

          {generatedKeys.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No key pairs generated yet.
            </Typography>
          ) : (
            generatedKeys.map((key) => (
              <Paper
                key={key.id}
                elevation={2}
                sx={{ p: 2, mb: 1, bgcolor: 'rgba(144, 202, 249, 0.08)', border: '1px solid rgba(144, 202, 249, 0.2)' }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2">
                      <strong>ID:</strong> {key.id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Algorithm:</strong> {key.algorithm}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Created:</strong> {new Date(key.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {key.used ? 'Used' : 'Available'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={() => handleCopyKey(key)}
                      title="Copy key data"
                    >
                      <ContentCopy />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteKey(key.id)}
                      title="Delete key"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))
          )}
        </Paper>
      </Collapse>
    </Box>
  );
}

export default KeyGeneratorButton;
