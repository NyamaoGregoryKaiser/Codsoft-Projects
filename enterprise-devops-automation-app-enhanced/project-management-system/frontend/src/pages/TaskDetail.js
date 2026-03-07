```javascript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as taskApi from '../api/tasks';
import * as commentApi from '../api/comments';
import * as userApi from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import CommentForm from '../components/CommentForm';
import './TaskDetail.css';
import moment from 'moment';

function TaskDetailPage() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // For updating assignee
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({});

  const isAssignee = task?.assignee?.id === currentUser?.id;
  const isProjectOwner = task?.project?.ownerId === currentUser?.id;
  const isAdmin = currentUser?.role === 'admin';
  const canEditTask = isAssignee || isProjectOwner || isAdmin;
  const canDeleteTask = isProjectOwner || isAdmin;

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const taskResponse = await taskApi.getTaskById(taskId);
      setTask(taskResponse.data);
      setComments(taskResponse.data.comments || []);
      setEditedTask({
        title: taskResponse.data.title,
        description: taskResponse.data.description,
        status: taskResponse.data.status,
        priority: taskResponse.data.priority,
        dueDate: taskResponse.data.dueDate ? moment(taskResponse.data.dueDate).format('YYYY-MM-DD') : '',
        assignedTo: taskResponse.data.assignee?.id || '',
      });

      const usersResponse = await userApi.getAllUsers();
      setAllUsers(usersResponse.data);

    } catch (err) {
      console.error("Failed to fetch task details:", err);
      setError(err.response?.data?.message || "Failed to load task details.");
      if (err.response && err.response.status === 403) {
        navigate(`/projects/${projectId}`, { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId, projectId]);

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await taskApi.updateTask(taskId, editedTask);
      setIsEditing(false);
      fetchTaskDetails(); // Re-fetch to show updated data
    } catch (err) {
      console.error("Failed to update task:", err);
      setError(err.response?.data?.message || "Failed to update task.");
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskApi.deleteTask(taskId);
      navigate(`/projects/${projectId}`); // Redirect to project detail page
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError(err.response?.data?.message || "Failed to delete task.");
    }
  };

  const handleAddComment = async (content) => {
    try {
      await commentApi.createComment({ taskId, content });
      fetchTaskDetails(); // Re-fetch comments
    } catch (err) {
      console.error("Failed to add comment:", err);
      setError(err.response?.data?.message || "Failed to add comment.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await commentApi.deleteComment(commentId);
      fetchTaskDetails(); // Re-fetch comments
    } catch (err) {
      console.error("Failed to delete comment:", err);
      setError(err.response?.data?.message || "Failed to delete comment.");
    }
  };


  if (loading) return <div className="loading-message">Loading task details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!task) return <div className="info-message">Task not found.</div>;

  const projectMembers = task.project ? (task.project.members || []) : []; // Assuming project has a 'members' array
  const availableAssignees = [{ id: '', name: 'Unassigned' }, ...allUsers.filter(u => u.id === task.project?.ownerId || projectMembers.some(m => m.id === u.id))];


  return (
    <div className="task-detail-page">
      <Link to={`/projects/${projectId}`} className="back-link">&larr; Back to Project</Link>
      <h1>Task: {task.title} <span className={`task-status-${task.status.toLowerCase().replace('-', '')}`}>{task.status}</span></h1>

      {isEditing ? (
        <form onSubmit={handleUpdateTask} className="task-edit-form">
          <div className="form-group">
            <label>Title:</label>
            <input type="text" value={editedTask.title} onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea value={editedTask.description} onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}></textarea>
          </div>
          <div className="form-group">
            <label>Status:</label>
            <select value={editedTask.status} onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority:</label>
            <select value={editedTask.priority} onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Assigned To:</label>
            <select value={editedTask.assignedTo} onChange={(e) => setEditedTask({ ...editedTask, assignedTo: e.target.value })}>
              {availableAssignees.map(u => (
                <option key={u.id || 'unassigned'} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Due Date:</label>
            <input type="date" value={editedTask.dueDate} onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="submit">Save Changes</button>
            <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <p><strong>Description:</strong> {task.description || 'No description provided.'}</p>
          <p><strong>Priority:</strong> <span className={`task-priority-${task.priority.toLowerCase()}`}>{task.priority}</span></p>
          <p><strong>Assigned To:</strong> {task.assignee?.name || 'Unassigned'}</p>
          <p><strong>Due Date:</strong> {task.dueDate ? moment(task.dueDate).format('YYYY-MM-DD') : 'N/A'}</p>
          <p><strong>Project:</strong> <Link to={`/projects/${task.project.id}`}>{task.project.name}</Link></p>
          <p><strong>Created By:</strong> {task.user?.name || 'N/A'}</p> {/* Assuming task has a creator relation */}

          {(canEditTask) && (
            <button onClick={() => setIsEditing(true)} className="edit-btn">Edit Task</button>
          )}
          {canDeleteTask && (
            <button onClick={handleDeleteTask} className="delete-btn">Delete Task</button>
          )}
        </>
      )}

      <section className="task-comments-section">
        <h2>Comments</h2>
        <div className="comments-list">
          {comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <p className="comment-author"><strong>{comment.user.name}</strong> on {moment(comment.createdAt).format('YYYY-MM-DD HH:mm')}</p>
                <p className="comment-content">{comment.content}</p>
                {(comment.userId === currentUser.id || isProjectOwner || isAdmin) && (
                  <button onClick={() => handleDeleteComment(comment.id)} className="delete-comment-btn">Delete</button>
                )}
              </div>
            ))
          ) : (
            <p>No comments yet.</p>
          )}
        </div>
        <CommentForm onAddComment={handleAddComment} />
      </section>
    </div>
  );
}

export default TaskDetailPage;
```