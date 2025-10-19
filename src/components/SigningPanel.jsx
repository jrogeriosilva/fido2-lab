import { useState, useEffect } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Typography
} from '@mui/material';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import { getAssertion } from '../utils/fido2Hardware';
import { createSimulatedAssertion } from '../utils/fido2Simulator';
import { getCredentials } from '../utils/localStorage';

const DEFAULT_JSON = {
  "challenge": "VN00RzBXws786lXX2NrBhxpV3002sfeLhvSHyY_m4RBp7yhX34hPHnCVy_55saIxkqGRlJGvpCNChduIrZSn7DiSnqq___E4EuJvw3QUFC9SrGKgvSVsQ6CptqTddl8jfQCBJoYRftQibRcBNWfDmQswtKb3Ee6y_fprIyD02nw",
  "allowCredentials": [
    {
      "id": "eADIe8jfFltERf136k_OpA",
      "type": "public-key"
    }
  ]
};

function SigningPanel({ mode, refreshKey, onAssertionGenerated }) {
  const [credentials, setCredentials] = useState([]);
  const [selectedCredentialId, setSelectedCredentialId] = useState('');
  const [jsonInput, setJsonInput] = useState(JSON.stringify(DEFAULT_JSON, null, 2));
  const [autoSelected, setAutoSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadCredentials();
  }, [refreshKey, mode]);

  useEffect(() => {
    // Try to parse JSON and auto-select credential if allowCredentials is provided
    try {
      const parsedJson = JSON.parse(jsonInput);
      if (parsedJson.allowCredentials && parsedJson.allowCredentials.length > 0) {
        const allowedId = parsedJson.allowCredentials[0].id;
        const matchedCredential = credentials.find(c => c.id === allowedId);
        if (matchedCredential) {
          setSelectedCredentialId(matchedCredential.id);
          setAutoSelected(true);
        } else {
          setAutoSelected(false);
        }
      } else {
        setAutoSelected(false);
      }
    } catch (e) {
      // Invalid JSON, ignore
      setAutoSelected(false);
    }
  }, [jsonInput, credentials]);

  const loadCredentials = () => {
    const allCredentials = getCredentials();
    // Filter credentials based on mode
    const filtered = mode === 'hardware'
      ? allCredentials.filter(c => c.type === 'hardware')
      : allCredentials.filter(c => c.type === 'simulated');

    setCredentials(filtered);

    // Reset selection if current selection is not in filtered list
    if (selectedCredentialId && !filtered.find(c => c.id === selectedCredentialId)) {
      setSelectedCredentialId('');
    }
  };

  const handleSign = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Parse JSON input
      let config;
      try {
        config = JSON.parse(jsonInput);
      } catch (e) {
        throw new Error(`Invalid JSON: ${e.message}`);
      }

      const challenge = config.challenge;
      if (!challenge) {
        throw new Error('Challenge is required in JSON configuration');
      }

      if (!selectedCredentialId) {
        throw new Error('Please select a credential');
      }

      const credential = credentials.find(c => c.id === selectedCredentialId);

      if (!credential) {
        throw new Error('Credential not found');
      }

      let assertion;

      if (mode === 'hardware') {
        // Use hardware authenticator
        assertion = await getAssertion({
          challenge,
          rpId: credential.rpId,
          credentialId: credential.credentialId
        });
      } else {
        // Use simulated authenticator
        assertion = await createSimulatedAssertion({
          challenge,
          credential,
          rpId: credential.rpId,
          signCount: 1
        });
      }

      setSuccess('Assertion generated successfully');

      if (onAssertionGenerated) {
        onAssertionGenerated(assertion);
      }

    } catch (err) {
      setError(`Error generating assertion: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configure assertion request in JSON format:
      </Typography>

      <Box
        sx={{
          mb: 2,
          border: '1px solid rgba(144, 202, 249, 0.3)',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: '#000',
          '& .npm__react-simple-code-editor__textarea': {
            outline: 'none !important',
            fontFamily: 'monospace !important',
          },
          '& pre': {
            fontFamily: 'monospace !important',
          }
        }}
      >
        <Editor
          value={jsonInput}
          onValueChange={setJsonInput}
          highlight={code => highlight(code, languages.json, 'json')}
          padding={16}
          style={{
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            backgroundColor: '#000',
            minHeight: '200px',
          }}
        />
      </Box>

      {!autoSelected && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="credential-select-label">Select Credential</InputLabel>
          <Select
            labelId="credential-select-label"
            value={selectedCredentialId}
            label="Select Credential"
            onChange={(e) => setSelectedCredentialId(e.target.value)}
          >
            {credentials.length === 0 && (
              <MenuItem disabled>
                No {mode} credentials available
              </MenuItem>
            )}
            {credentials.map((credential) => (
              <MenuItem key={credential.id} value={credential.id}>
                {credential.userName || credential.userId} ({credential.algorithm}) - {credential.id.substring(0, 16)}...
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {autoSelected && selectedCredentialId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Auto-selected credential: {credentials.find(c => c.id === selectedCredentialId)?.userName || credentials.find(c => c.id === selectedCredentialId)?.userId}
        </Alert>
      )}

      {credentials.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No {mode} credentials available. Create one first.
        </Alert>
      )}

      <Button
        variant="contained"
        color="secondary"
        onClick={handleSign}
        disabled={loading || !selectedCredentialId}
      >
        {loading ? 'Signing...' : 'Sign Challenge (Create Assertion)'}
      </Button>

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

export default SigningPanel;
