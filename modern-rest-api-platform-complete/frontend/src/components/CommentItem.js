import React from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../utils/helpers';

function CommentItem({ comment, currentUserId, onDelete, onEdit }) {
  const isAuthor = comment.author_id === currentUserId;

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-3 flex justify-between items-start">
      <div>
        <div className="text-sm text-gray-800 font-medium">
          {comment.content}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          By <span className="font-semibold">{comment.author.email}</span> on{' '}
          {formatDate(comment.created_at)}
        </div>
      </div>
      {isAuthor && (
        <div className="flex space-x-2 ml-4 flex-shrink-0">
          <button
            onClick={() => onEdit(comment)}
            className="text-blue-500 hover:text-blue-700 p-1 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-colors"
            title="Edit Comment"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(comment.id)}
            className="text-red-500 hover:text-red-700 p-1 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-colors"
            title="Delete Comment"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default CommentItem;
```