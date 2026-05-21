import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/ui/Button';
import Modal from '../components/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, CalendarIcon, UserIcon, TagIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { TaskStatus, TaskPriority } from '../utils/helpers';

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]); // For assignee dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Task Modal states
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editedTask, setEditedTask] = useState(null); // Separate state for edited form
  const [taskFormErrors, setTaskFormErrors] = useState({});

  // Add Comment states
  const [newCommentText, setNewCommentText] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [addingComment, setAddingComment] = useState(false);

  const fetchTaskDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const taskResponse = await api.get(`/tasks/${taskId}`);
      setTask(taskResponse.data);
      setComments(taskResponse.data.comments || []);

      // Pre-fill editedTask for the modal if the task exists
      if (taskResponse.data) {
        setEditedTask({
          ...taskResponse.data,
          assignee_id: taskResponse.data.assignee_id || '',
          due_date: taskResponse.data.due_date ? new Date(taskResponse.data.due_date).toISOString().split('T')[0] : '',
        });
      }

      // Fetch all users for assignee dropdown
      const usersResponse = await api.get('/users', { params: { limit: 100 } });
      setUsers(usersResponse.data);

    } catch (err) {
      console.error("Failed to fetch task details:", err);
      setError(err.response?.data?.message || "Failed to load task details. You might not have access.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  const handleEditClick = () => {
    setShowEditTaskModal(true);
    setTaskFormErrors({});
  };

  const handleDeleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }
    try {
      await api.delete(`/tasks/${taskId}`);
      alert("Task deleted successfully!");
      navigate(`/projects/${task.project_id}`); // Go back to project page
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError(err.response?.data?.message || "Failed to delete task.");
    }
  };

  const handleEditTaskModalClose = () => {
    setShowEditTaskModal(false);
    // Reset editedTask to original task data on close if not saved
    if (task) {
      setEditedTask({
        ...task,
        assignee_id: task.assignee_id || '',
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      });
    }
    setTaskFormErrors({});
  };

  const handleEditTaskInputChange = (e) => {
    const { id, value } = e.target;
    setEditedTask((prev) => ({ ...prev, [id]: value }));
    setTaskFormErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const validateTaskForm = () => {
    const errors = {};
    if (!editedTask.title) errors.title = "Title is required.";
    // project_id is not editable in this flow, assuming it's fixed.
    if (editedTask.due_date && new Date(editedTask.due_date) < new Date(new Date().setHours(0,0,0,0))) errors.due_date = "Due date cannot be in the past.";
    setTaskFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditTaskSubmit = async () => {
    if (!validateTaskForm()) return;

    try {
      const taskPayload = {
        title: editedTask.title,
        description: editedTask.description,
        status: editedTask.status,
        priority: editedTask.priority,
        due_date: editedTask.due_date ? new Date(editedTask.due_date).toISOString() : null,
        assignee_id: editedTask.assignee_id ? parseInt(editedTask.assignee_id) : null,
        project_id: editedTask.project_id // Keep project_id as is
      };

      await api.put(`/tasks/${taskId}`, taskPayload);
      alert("Task updated successfully!");
      handleEditTaskModalClose();
      fetchTaskDetails(); // Re-fetch task details to show updates
    } catch (err) {
      console.error("Failed to update task:", err);
      setError(err.response?.data?.message || "Failed to update task.");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setCommentError(null);
    if (!newCommentText.trim()) {
      setCommentError("Comment cannot be empty.");
      return;
    }
    setAddingComment(true);
    try {
      await api.post(`/tasks/${taskId}/comments`, { comment_text: newCommentText, task_id: parseInt(taskId) });
      setNewCommentText('');
      fetchTaskDetails(); // Refresh comments
    } catch (err) {
      console.error("Failed to add comment:", err);
      setCommentError(err.response?.data?.message || "Failed to add comment.");
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }
    try {
      await api.delete(`/tasks/comments/${commentId}`);
      alert("Comment deleted successfully!");
      fetchTaskDetails(); // Refresh comments
    } catch (err) {
      console.error("Failed to delete comment:", err);
      setCommentError(err.response?.data?.message || "Failed to delete comment.");
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'To Do': return 'bg-gray-200 text-gray-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Done': return 'bg-green-100 text-green-800';
      case 'Blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColorClass = (priority) => {
    switch (priority) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-orange-600';
      case 'Critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const taskStatusOptions = Object.values(TaskStatus).map(status => ({ value: status, label: status }));
  const taskPriorityOptions = Object.values(TaskPriority).map(priority => ({ value: priority, label: priority }));
  const assigneeOptions = users.map(u => ({ value: u.id.toString(), label: u.username }));
  assigneeOptions.unshift({ value: '', label: 'Unassigned' });

  if (loading) {
    return <LoadingSpinner className="h-48" />;
  }

  if (error) {
    return <div className="text-center text-red-600 text-lg my-8">{error}</div>;
  }

  if (!task) {
    return <div className="text-center text-gray-600 text-lg my-8">Task not found or you don't have access.</div>;
  }

  // Determine user permissions for actions
  const isCreator = user?.id === task.creator_id;
  const isAssignee = user?.id === task.assignee_id;
  const isProjectOwner = user?.id === task.project?.owner_id;
  const isSuperuser = user?.is_superuser;

  const canEditTask = isCreator || isProjectOwner || isSuperuser || (isAssignee && task.status !== 'Done');
  const canDeleteTask = isCreator || isProjectOwner || isSuperuser;

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(`/projects/${task.project_id}`)} className="mr-4">
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClass(task.status)}`}>
              {task.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gray-100 ${getPriorityColorClass(task.priority)}`}>
              {task.priority}
            </span>
          </div>
          {(canEditTask || canDeleteTask) && (
            <div className="flex space-x-2">
              {canEditTask && (
                <Button variant="outline" size="sm" onClick={handleEditClick}>Edit Task</Button>
              )}
              {canDeleteTask && (
                <Button variant="danger" size="sm" onClick={handleDeleteTask}>Delete Task</Button>
              )}
            </div>
          )}
        </div>

        <p className="text-gray-700 text-lg mb-6">{task.description || 'No description provided.'}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 text-sm border-t border-b py-4 mb-6">
          <div className="flex items-center">
            <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span><strong>Creator:</strong> {task.creator?.username || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span><strong>Assignee:</strong> {task.assignee?.username || 'Unassigned'}</span>
          </div>
          <div className="flex items-center">
            <TagIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span><strong>Project:</strong> <Button variant="ghost" className="p-0 text-sm text-primary hover:text-primary-dark" onClick={() => navigate(`/projects/${task.project_id}`)}>{task.project?.name || 'N/A'}</Button></span>
          </div>
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span><strong>Due Date:</strong> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
          </div>
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span><strong>Created:</strong> {new Date(task.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span><strong>Last Updated:</strong> {new Date(task.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Comments Section */}
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Comments ({comments.length})</h3>
        <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
          {comments.length === 0 ? (
            <p className="text-gray-600 text-sm">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-gray-800">{comment.user?.username || 'Unknown User'}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <span>{new Date(comment.created_at).toLocaleString()}</span>
                    {(comment.user_id === user?.id || isCreator || isProjectOwner || isSuperuser) && (
                      <Button variant="ghost" size="sm" className="ml-2 p-1 text-gray-400 hover:text-danger" onClick={() => handleDeleteComment(comment.id)}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{comment.comment_text}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleCommentSubmit} className="mt-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary resize-y min-h-[80px]"
            placeholder="Add a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
          ></textarea>
          {commentError && <p className="text-red-500 text-sm mt-1">{commentError}</p>}
          <Button type="submit" className="mt-3" disabled={addingComment}>
            {addingComment ? <LoadingSpinner size="sm" className="inline-block mr-2" /> : null}
            Add Comment
          </Button>
        </form>
      </div>

      {/* Edit Task Modal */}
      {editedTask && (
        <Modal
          isOpen={showEditTaskModal}
          onClose={handleEditTaskModalClose}
          title="Edit Task"
          onSubmit={handleEditTaskSubmit}
          submitText="Update Task"
        >
          <Input
            label="Title"
            id="title"
            value={editedTask.title}
            onChange={handleEditTaskInputChange}
            error={taskFormErrors.title}
            required
            disabled={!canEditTask} // Only editable if user has full edit rights
          />
          <Input
            label="Description"
            id="description"
            value={editedTask.description}
            onChange={handleEditTaskInputChange}
            error={taskFormErrors.description}
            type="textarea"
            disabled={!canEditTask && !isAssignee} // Assignees can edit description
          />
          <Select
            label="Assignee"
            id="assignee_id"
            value={editedTask.assignee_id}
            onChange={handleEditTaskInputChange}
            options={assigneeOptions}
            error={taskFormErrors.assignee_id}
            disabled={!canEditTask}
          />
          <Select
            label="Status"
            id="status"
            value={editedTask.status}
            onChange={handleEditTaskInputChange}
            options={taskStatusOptions}
            error={taskFormErrors.status}
            required
            disabled={!canEditTask && !isAssignee} // Assignees can edit status
          />
          <Select
            label="Priority"
            id="priority"
            value={editedTask.priority}
            onChange={handleEditTaskInputChange}
            options={taskPriorityOptions}
            error={taskFormErrors.priority}
            required
            disabled={!canEditTask && !isAssignee} // Assignees can edit priority
          />
          <Input
            label="Due Date"
            id="due_date"
            type="date"
            value={editedTask.due_date}
            onChange={handleEditTaskInputChange}
            error={taskFormErrors.due_date}
            disabled={!canEditTask && !isAssignee} // Assignees can edit due date
          />
        </Modal>
      )}
    </div>
  );
};

export default TaskDetailPage;