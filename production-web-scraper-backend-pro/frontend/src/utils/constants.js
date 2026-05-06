```javascript
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

export const SELECTOR_TYPES = [
    { value: 'text', label: 'Text Content' },
    { value: 'html', label: 'Inner HTML' },
    { value: 'attribute', label: 'Attribute Value' },
    { value: 'list', label: 'List of Elements (with sub-fields)' },
    // { value: 'screenshot', label: 'Screenshot (Placeholder)' }, // Placeholder, not fully implemented for binary data in this project
];

export const SCHEDULER_CRON_EXAMPLES = [
    '0 0 * * * (daily at midnight)',
    '0 */6 * * * (every 6 hours)',
    '0 9-17 * * 1-5 (every hour between 9am-5pm Mon-Fri)',
    '* * * * * (every minute - use with caution!)',
];
```