import { Box, Typography } from '@mui/material';
import JsonDisplay from './JsonDisplay';

function AssertionDisplay({ assertion }) {
  // Format assertion to match the desired output structure
  const formattedAssertion = {
    id: assertion.id,
    rawId: assertion.rawId,
    response: {
      authenticatorData: assertion.response?.authenticatorData,
      signature: assertion.response?.signature,
      clientDataJSON: assertion.response?.clientDataJSON,
      userHandle: assertion.response?.userHandle,
      type: "public-key"
    }
  };

  // Remove undefined fields
  Object.keys(formattedAssertion.response).forEach(key => {
    if (formattedAssertion.response[key] === undefined) {
      delete formattedAssertion.response[key];
    }
  });

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
        Generated Assertion
      </Typography>
      <JsonDisplay data={formattedAssertion} maxHeight={600} />
    </Box>
  );
}

export default AssertionDisplay;
