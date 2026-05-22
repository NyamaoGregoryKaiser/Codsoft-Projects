```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Task, Comment, User, TaskStatus, TaskPriority, PaginatedResponse } from 'types';
import * as taskApi from 'api/tasks';
import * as commentApi from 'api/comments';
import * as userApi from 'api/users';
import Modal from 'components/Modal';
import Pagination from 'components/Pagination';
import { useAuth } from 'contexts/AuthContext';
import './TaskDetailsPage.css';

const TaskDetailsPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [taskLoading, setTaskLoading] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentsPagination, setCommentsPagination] = useState({
    total: 0,
    limit: 10,
    page: 1,
    totalPages: 0,
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState<string>('');
  const [taskAssigneeId, setTaskAssigneeId] = useState<string | undefined>('');
  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  const [newCommentContent, setNewCommentContent] = useState('');
  const [commentFormError, setCommentFormError] = useState<string | null>(null);
  const [isCommentEditing, setIsCommentEditing] = useState<string | null>(null); // ID of comment being edited
  const [editedCommentContent, setEditedCommentContent] = useState('');

  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const fetchTaskDetails = useCallback(async () => {
    if (!taskId) return;
    setTaskLoading(true);
    setTaskError(null);
    try {
      const res = await taskApi.getTaskById(taskId);
      if (res.success && res.data) {
        setTask(res.data);
        setTaskTitle(res.data.title);
        setTaskDescription(res.data.description || '');
        setTaskStatus(res.data.status);
        setTaskPriority(res.data.priority);
        setTaskDueDate(res.data.dueDate ? new Date(res.data.dueDate).toISOString().split('T')[0] : '');
        setTaskAssigneeId(res.data.assignee?.id || '');
      } else {
        setTaskError(res.message || 'Failed to fetch task details.');
      }
    } catch (err: any) {
      setTaskError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setTaskLoading(false);
    }
  }, [taskId]);

  const fetchComments = useCallback(async (page = 1, limit = 10) => {
    if (!taskId) return;
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const res = await commentApi.getCommentsByTask(taskId, page, limit);
      if (res.success && res.data) {
        setComments(res.data.data);
        setCommentsPagination(res.data.pagination);
      } else {
        setCommentsError(res.message || 'Failed to fetch comments.');
      }
    } catch (err: any) {
      setCommentsError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setCommentsLoading(false);
    }
  }, [taskId]);

  const fetchAssignableUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await userApi.getUsers();
      if (res.success && res.data) {
        setAssignableUsers(res.data.data.filter(u => u.role !== 'admin'));
      }
    } catch (err) {
      console.error('Failed to fetch assignable users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaskDetails();
    fetchComments();
    fetchAssignableUsers();
  }, [fetchTaskDetails, fetchComments, fetchAssignableUsers]);

  const handleOpenEditModal = () => {
    if (task) {
      setTaskTitle(task.title);
      setTaskDescription(task.description || '');
      setTaskStatus(task.status);
      setTaskPriority(task.priority);
      setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setTaskAssigneeId(task.assignee?.id || '');
      setTaskFormError(null);
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFormError(null);
    if (!taskId) return;
    if (!taskTitle.trim()) {
      setTaskFormError('Task title cannot be empty.');
      return;
    }

    const payload = {
      title: taskTitle,
      description: taskDescription,
      status: taskStatus,
      priority: taskPriority,
      dueDate: taskDueDate || null,
      assigneeId: taskAssigneeId || null,
    };

    try {
      await taskApi.updateTask(taskId, payload);
      setIsEditModalOpen(false);
      fetchTaskDetails(); // Re-fetch task details to show updates
    } catch (err: any) {
      setTaskFormError(err.response?.data?.message || 'Failed to update task.');
    }
  };

  const handleDeleteTask = async () => {
    if (!taskId) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskApi.deleteTask(taskId);
        navigate(`/projects/${task?.project.id}`); // Redirect back to project details
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete task.');
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentFormError(null);
    if (!taskId) return;
    if (!newCommentContent.trim()) {
      setCommentFormError('Comment cannot be empty.');
      return;
    }

    try {
      await commentApi.createComment(taskId, { content: newCommentContent });
      setNewCommentContent('');
      fetchComments(); // Refresh comments list
    } catch (err: any) {
      setCommentFormError(err.response?.data?.message || 'Failed to add comment.');
    }
  };

  const handleEditComment = (comment: Comment) => {
    setIsCommentEditing(comment.id);
    setEditedCommentContent(comment.content);
  };

  const handleSaveEditedComment = async (commentId: string) => {
    setCommentFormError(null);
    if (!editedCommentContent.trim()) {
      setCommentFormError('Comment cannot be empty.');
      return;
    }
    try {
      await commentApi.updateComment(commentId, { content: editedCommentContent });
      setIsCommentEditing(null);
      fetchComments();
    } catch (err: any) {
      setCommentFormError(err.response?.data?.message || 'Failed to update comment.');
    }
  };

  const handleCancelEditComment = () => {
    setIsCommentEditing(null);
    setEditedCommentContent('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await commentApi.deleteComment(commentId);
        fetchComments(); // Refresh comments list
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete comment.');
      }
    }
  };

  const handleCommentsPageChange = (page: number) => {
    fetchComments(page, commentsPagination.limit);
  };

  if (taskLoading) return <div className="loading-state">Loading task details...</div>;
  if (taskError) return <div className="error-state">Error: {taskError}</div>;
  if (!task) return <div className="error-state">Task not found.</div>;

  const isProjectOwner = currentUser?.id === task.project.owner.id;
  const isTaskAssignee = currentUser?.id === task.assignee?.id;
  const canEditTask = isProjectOwner || isTaskAssignee;
  const canDeleteTask = isProjectOwner; // Only project owner can delete task

  return (
    <div className="task-details-page-container">
      <header className="task-details-header">
        <h1>{task.title}</h1>
        <div className="task-actions">
          {canEditTask && (
            <button onClick={handleOpenEditModal} className="btn secondary-btn">Edit Task</button>
          )}
          {canDeleteTask && (
            <button onClick={handleDeleteTask} className="btn delete-btn">Delete Task</button>
          )}
        </div>
      </header>

      <section className="task-info">
        <p><strong>Project:</strong> <a href={`/projects/${task.project.id}`}>{task.project.name}</a></p>
        <p><strong>Description:</strong> {task.description || 'N/A'}</p>
        <p><strong>Status:</strong> <span className={`status-${task.status}`}>{task.status.replace('-', ' ')}</span></p>
        <p><strong>Priority:</strong> <span className={`priority-${task.priority}`}>{task.priority}</span></p>
        <p><strong>Due Date:</strong> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Assignee:</strong> {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}</p>
        <p><strong>Created At:</strong> {new Date(task.createdAt).toLocaleString()}</p>
        <p><strong>Last Updated:</strong> {new Date(task.updatedAt).toLocaleString()}</p>
      </section>

      <section className="comments-section">
        <h2>Comments</h2>
        {commentFormError && <p className="error-message">{commentFormError}</p>}
        <form onSubmit={handleAddComment} className="comment-form">
          <textarea
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            required
            aria-label="Add new comment"
          ></textarea>
          <button type="submit" className="btn primary-btn">Add Comment</button>
        </form>

        <div className="comments-list">
          {commentsLoading && comments.length === 0 ? (
            <div className="loading-state">Loading comments...</div>
          ) : commentsError ? (
            <div className="error-state">Error loading comments: {commentsError}</div>
          ) : comments.length === 0 ? (
            <p className="no-content-message">No comments yet. Be the first to add one!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="comment-card">
                <div className="comment-header">
                  <strong>{comment.user.firstName} {comment.user.lastName}</strong>
                  <span>{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                {isCommentEditing === comment.id ? (
                  <div className="comment-edit-form">
                    <textarea
                      value={editedCommentContent}
                      onChange={(e) => setEditedCommentContent(e.target.value)}
                      rows={3}
                    ></textarea>
                    <button onClick={() => handleSaveEditedComment(comment.id)} className="btn primary-btn btn-sm">Save</button>
                    <button onClick={handleCancelEditComment} className="btn secondary-btn btn-sm">Cancel</button>
                  </div>
                ) : (
                  <p className="comment-content">{comment.content}</p>
                )}
                {(currentUser?.id === comment.user.id || isProjectOwner) && (
                  <div className="comment-actions">
                    {currentUser?.id === comment.user.id && isCommentEditing !== comment.id && (
                      <button onClick={() => handleEditComment(comment)} className="btn btn-sm">Edit</button>
                    )}
                    <button onClick={() => handleDeleteComment(comment.id)} className="btn delete-btn btn-sm">Delete</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {commentsPagination.totalPages > 1 && (
          <Pagination
            currentPage={commentsPagination.page}
            totalPages={commentsPagination.totalPages}
            onPageChange={handleCommentsPageChange}
          />
        )}
      </section>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Task">
        <form onSubmit={handleUpdateTask} className="task-form">
          {taskFormError && <p className="error-message">{taskFormError}</p>}
          <div className="form-group">
            <label htmlFor="taskTitle">Task Title:</label>
            <input
              type="text"
              id="taskTitle"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
              aria-label="Task Title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="taskDescription">Description:</label>
            <textarea
              id="taskDescription"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={4}
              aria-label="Task Description"
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="taskStatus">Status:</label>
            <select
              id="taskStatus"
              value={taskStatus}
              onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
              aria-label="Task Status"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="taskPriority">Priority:</label>
            <select
              id="taskPriority"
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
              aria-label="Task Priority"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="taskDueDate">Due Date:</label>
            <input
              type="date"
              id="taskDueDate"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              aria-label="Task Due Date"
            />
          </div>
          <div className="form-group">
            <label htmlFor="taskAssignee">Assignee:</label>
            <select
              id="taskAssignee"
              value={taskAssigneeId}
              onChange={(e) => setTaskAssigneeId(e.target.value || undefined)}
              aria-label="Task Assignee"
              disabled={usersLoading}
            >
              <option value="">Unassigned</option>
              {assignableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn primary-btn">Update Task</button>
        </form>
      </Modal>
    </div>
  );
};

export default TaskDetailsPage;
```