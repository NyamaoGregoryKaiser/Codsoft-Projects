```javascript
import React, { useState } from 'react';
import './CommentForm.css';

function CommentForm({ onAddComment }) {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onAddComment(content);
      setContent('');
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        rows="3"
        required
      ></textarea>
      <button type="submit">Add Comment</button>
    </form>
  );
}

export default CommentForm;
```