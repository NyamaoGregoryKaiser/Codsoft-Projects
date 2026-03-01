import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import CommentItem from '../components/CommentItem';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/helpers';

const statusColors = {
  todo: 'bg-gray-200 text-gray-800',
  in_progress: 'bg-blue-200 text-blue-800',
  done: 'bg-green-200 text-green-800',
};

const priorityColors = {
  low: 'bg-yellow-100 text-yellow-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
};

function TaskDetailsPage() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [editingComment, setEditingComment] = useState(null); // For editing comments

  useEffect(() => {
    fetchTaskDetails();
    fetchComments();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/tasks/${taskId}`);
      setTask(response.data);
    } catch (err) {
      console.error('Failed to fetch task details:', err);
      setError('Failed to load task details.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    setError(null);
    try {
      const response = await api.get(`/comments/by_task/${taskId}`);
      setComments(response.data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError('Failed to load comments.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;

    setError(null);
    try {
      if (editingComment) {
        // Update existing comment
        const response = await api.put(`/comments/${editingComment.id}`, { content: newCommentContent });
        setComments(comments.map(c => c.id === editingComment.id ? response.data : c));
        setEditingComment(null);
      } else {
        // Create new comment
        const response = await api.post('/comments/', {
          task_id: parseInt(taskId),
          content: newCommentContent,
        });
        setComments([...comments, response.data]);
      }
      setNewCommentContent('');
    } catch (err) {
      console.error('Failed to save comment:', err);
      setError('Failed to save comment.');
    }
  };

  const handleEditComment = (comment) => {
    setNewCommentContent(comment.content);
    setEditingComment(comment);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setError('Failed to delete comment.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner size="h-10 w-10" color="text-blue-600" />
      </div>
    );
  }

  if (!task) {
    return <div className="text-center text-gray-600 text-lg mt-10">Task not found.</div>;
  }

  return (
    <div className="py-8">
      <button
        onClick={() => navigate(`/projects/${projectId}`)}
        className="mb-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        &larr; Back to Project
      </button>

      <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">{task.title}</h1>
        <p className="text-lg text-gray-700 mb-4">{task.description || 'No description provided.'}</p>
        
        <div className="flex items-center space-x-4 mb-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
              statusColors[task.status]
            }`}
          >
            {task.status.replace('_', ' ')}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
              priorityColors[task.priority]
            }`}
          >
            {task.priority} Priority
          </span>
        </div>

        <div className="text-md text-gray-600 mb-2">
          Assigned To:{' '}
          <span className="font-semibold text-gray-800">
            {task.assigned_to ? task.assigned_to.email : 'Unassigned'}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Created: {formatDate(task.created_at)} | Last Updated: {formatDate(task.updated_at)}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Comments</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleAddComment} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y"
            rows="3"
            placeholder={editingComment ? "Edit your comment..." : "Add a new comment..."}
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            required
          ></textarea>
          <div className="flex justify-end mt-4">
            {editingComment && (
              <button
                type="button"
                onClick={() => {
                  setNewCommentContent('');
                  setEditingComment(null);
                }}
                className="mr-3 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingComment ? 'Update Comment' : 'Post Comment'}
            </button>
          </div>
        </form>

        {comments.length === 0 ? (
          <p className="text-center text-gray-600 text-lg mt-10">No comments yet. Be the first to add one!</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUser?.id}
                onDelete={handleDeleteComment}
                onEdit={handleEditComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDetailsPage;
```