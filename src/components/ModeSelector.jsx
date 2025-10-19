import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';

function ModeSelector({ mode, onChange }) {
  return (
    <FormControl>
      <FormLabel id="mode-selector-label">Select Authentication Mode</FormLabel>
      <RadioGroup
        aria-labelledby="mode-selector-label"
        value={mode}
        onChange={(e) => onChange(e.target.value)}
        row
      >
        <FormControlLabel
          value="simulated"
          control={<Radio />}
          label="Simulated (No Hardware)"
        />
        <FormControlLabel
          value="hardware"
          control={<Radio />}
          label="Hardware API (Authenticator Required)"
        />
      </RadioGroup>
    </FormControl>
  );
}

export default ModeSelector;
