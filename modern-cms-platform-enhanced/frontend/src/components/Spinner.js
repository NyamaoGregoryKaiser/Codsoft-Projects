```javascript
import React from 'react';
import { ClipLoader } from 'react-spinners';

const Spinner = ({ size = 35, color = "#4F46E5", loading = true }) => {
  return (
    <div className="flex justify-center items-center">
      <ClipLoader color={color} loading={loading} size={size} />
    </div>
  );
};

export default Spinner;
```