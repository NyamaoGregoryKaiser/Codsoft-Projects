export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString(); // Or format as desired
    } catch (e) {
      console.error("Invalid date string:", dateString, e);
      return 'Invalid Date';
    }
  };
  
  // Add other utility functions here as needed
```