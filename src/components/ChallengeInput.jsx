import { TextField } from '@mui/material';

function ChallengeInput({ challenge, onChange }) {
  return (
    <TextField
      fullWidth
      label="FIDO2 Challenge"
      placeholder="Enter challenge (base64url encoded or plain text)"
      value={challenge}
      onChange={(e) => onChange(e.target.value)}
      multiline
      rows={3}
      variant="outlined"
      helperText="Enter the challenge from your FIDO2 server"
    />
  );
}

export default ChallengeInput;
