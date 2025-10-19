import { useState } from 'react';
import {
  Button,
  Box,
  Alert,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import { createCredential } from '../utils/fido2Hardware';
import { createSimulatedCredential } from '../utils/fido2Simulator';
import { saveCredential, getGeneratedKeys } from '../utils/localStorage';
import JsonDisplay from './JsonDisplay';

const DEFAULT_JSON = {
  "rp": {
    "name": "Rogerio Bank"
  },
  "user": {
    "id": "iE2EpTdwsz5KvUbanpLoqq7ZtiTeQcPn"
  },
  "challenge": "elDBLGCwRwGCOMRCQkloMmn9PdbaF8YlLzZpEFX9AAUa4uVyDVraNAeL3gkio1IIpfg4HsCjTZI65cm__1BTynLoa4I6oes4avuz5SVHOsZ8leYwbjuHaTdztrlzafnmkKyYlqsor1i4YNlpXlaicavlnQXl-Pkhjeptqu-pQwM",
  "pubKeyCredParams": [
    {
      "type": "public-key",
      "alg": -7
    },
    {
      "type": "public-key",
      "alg": -257
    }
  ],
  "timeout": 60000,
  "attestation": "direct",
  "authenticatorSelection": {
    "authenticatorAttachment": "cross-platform",
    "requireResidentKey": true,
    "userVerification": "required"
  }
};

function CreateCredentialForm({ mode, onCredentialCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [jsonInput, setJsonInput] = useState(JSON.stringify(DEFAULT_JSON, null, 2));
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [result, setResult] = useState(null);

  const generatedKeys = getGeneratedKeys().filter(key => !key.used);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResult(null);

    try {
      // Parse JSON input
      let config;
      try {
        config = JSON.parse(jsonInput);
      } catch (e) {
        throw new Error(`Invalid JSON: ${e.message}`);
      }

      // Extract parameters from config
      const rpId = config.rp?.id || window.location.hostname;
      const rpName = config.rp?.name || 'FIDO2 Test Client';
      const userId = config.user?.id || 'test-user';
      const userName = config.user?.name || 'testuser@example.com';
      const userDisplayName = config.user?.displayName || 'Test User';
      const challengeToUse = config.challenge;

      if (!challengeToUse) {
        throw new Error('Challenge is required in JSON configuration');
      }

      // Determine algorithm from pubKeyCredParams
      let algorithm = 'ES256';
      if (config.pubKeyCredParams && config.pubKeyCredParams.length > 0) {
        const firstAlg = config.pubKeyCredParams[0].alg;
        if (firstAlg === -7) {
          algorithm = 'ES256';
        } else if (firstAlg === -257) {
          algorithm = 'RS256';
        }
      }

      let credential;

      if (mode === 'hardware') {
        // Use hardware authenticator
        const hwCredential = await createCredential({
          challenge: challengeToUse,
          rpId,
          rpName,
          userId,
          userName,
          userDisplayName
        });

        credential = {
          id: hwCredential.id,
          type: 'hardware',
          algorithm: 'Unknown',
          credentialId: hwCredential.rawId,
          response: hwCredential.response,
          rpId,
          rpName,
          userId,
          userName,
          userDisplayName,
          createdAt: new Date().toISOString()
        };

        // Prepare result in the desired format
        setResult({
          id: hwCredential.id,
          rawId: hwCredential.rawId,
          response: {
            attestationObject: hwCredential.response.attestationObject,
            clientDataJSON: hwCredential.response.clientDataJSON,
            type: "public-key"
          }
        });
      } else {
        // Use simulated authenticator
        let existingKeyPair = null;

        // In simulated mode, a key must be selected
        if (!selectedKeyId) {
          throw new Error('Please select a pre-generated key');
        }

        const key = generatedKeys.find(k => k.id === selectedKeyId);
        if (key) {
          existingKeyPair = {
            publicKey: key.publicKey,
            privateKey: key.privateKey
          };
        } else {
          throw new Error('Selected key not found');
        }

        const simCredential = await createSimulatedCredential({
          challenge: challengeToUse,
          algorithm,
          rpId,
          rpName,
          userId,
          userName,
          userDisplayName,
          existingKeyPair
        });

        credential = {
          id: simCredential.id,
          type: 'simulated',
          algorithm: simCredential.algorithm,
          credentialId: simCredential.rawId,
          publicKeyJWK: simCredential.publicKeyJWK,
          privateKeyJWK: simCredential.privateKeyJWK,
          response: simCredential.response,
          rpId: simCredential.rpId,
          rpName: simCredential.rpName,
          userId: simCredential.userId,
          userName: simCredential.userName,
          userDisplayName: simCredential.userDisplayName,
          createdAt: simCredential.createdAt
        };

        // Prepare result in the desired format
        setResult({
          id: simCredential.id,
          rawId: simCredential.rawId,
          response: {
            attestationObject: simCredential.response.attestationObject,
            clientDataJSON: simCredential.response.clientDataJSON,
            type: "public-key"
          }
        });
      }

      // Save credential
      const saved = saveCredential(credential);

      if (saved) {
        setSuccess(`Credential created successfully (${credential.type})`);
        if (onCredentialCreated) {
          onCredentialCreated();
        }
      } else {
        setError('Failed to save credential');
      }
    } catch (err) {
      setError(`Error creating credential: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configure credential creation parameters in JSON format:
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
            minHeight: '400px',
          }}
        />
      </Box>

      {mode === 'simulated' && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="key-select-label">Select Pre-generated Key *</InputLabel>
          <Select
            labelId="key-select-label"
            id="key-select"
            value={selectedKeyId}
            label="Select Pre-generated Key *"
            onChange={(e) => setSelectedKeyId(e.target.value)}
            required
          >
            {generatedKeys.length === 0 ? (
              <MenuItem disabled value="">
                <em>No keys available - Generate one in Settings</em>
              </MenuItem>
            ) : (
              generatedKeys.map((key) => (
                <MenuItem key={key.id} value={key.id}>
                  {key.id} - {key.algorithm} - {new Date(key.createdAt).toLocaleString()}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      )}

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreate}
          disabled={loading || (mode === 'simulated' && !selectedKeyId)}
        >
          {loading ? 'Creating...' : `Create ${mode === 'hardware' ? 'Hardware' : 'Simulated'} Credential`}
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
            Created Credential
          </Typography>
          <JsonDisplay data={result} maxHeight={600} />
        </Box>
      )}
    </Box>
  );
}

export default CreateCredentialForm;
