import React from 'react';
import { FormControl, FormLabel, Textarea, FormErrorMessage } from '@chakra-ui/react';

const RichTextEditor = ({ value, onChange, label, placeholder, isInvalid, error, ...props }) => {
  return (
    <FormControl isInvalid={isInvalid} mb={4}>
      {label && <FormLabel>{label}</FormLabel>}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        minH="200px"
        rows={10}
        {...props}
      />
      {isInvalid && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
};

export default RichTextEditor;
```

#### `frontend/src/pages/Auth/LoginPage.js`

```javascript