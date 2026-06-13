import React from 'react';

const ContentEditor = ({ content, onContentChange }) => {
  // In a real CMS, this would be a rich text editor like TinyMCE, Quill, or a markdown editor.
  // For this example, we'll use a simple textarea.

  return (
    <div className="mb-4">
      <label htmlFor="content" className="block text-gray-700 text-sm font-bold mb-2">
        Content:
      </label>
      <textarea
        id="content"
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-48"
        placeholder="Write your post content here..."
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
      ></textarea>
    </div>
  );
};

export default ContentEditor;