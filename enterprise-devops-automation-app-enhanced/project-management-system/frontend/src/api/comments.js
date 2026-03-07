```javascript
import api from './axios';

export const getCommentsByTask = (taskId) => api.get(`/comments/${taskId}/task`);
export const createComment = (commentData) => api.post('/comments', commentData);
export const updateComment = (commentId, commentData) => api.patch(`/comments/${commentId}`, commentData);
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`);
```