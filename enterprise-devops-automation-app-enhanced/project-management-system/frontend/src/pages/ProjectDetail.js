```javascript
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as projectApi from '../api/projects';
import * as taskApi from '../api/tasks';
import * as userApi from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import TaskCard from '../components/TaskCard';
import './ProjectDetail.css';
import moment from 'moment';

function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newMemberId, setNewMemberId] = useState('');

  const isOwner = project?.ownerId === currentUser?.id || currentUser?.role === 'admin';
  const isMember = project?.members?.some(member => member.id === currentUser?.id) || isOwner;

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const projectResponse = await projectApi.getProjectById(projectId);
      setProject(projectResponse.data);
      setTasks(projectResponse.data.tasks || []);
      setMembers(projectResponse.data.members || []);

      const usersResponse = await userApi.getAllUsers();
      setAllUsers(usersResponse.data);

    } catch (err) {
      console.error("Failed to fetch project details:", err);
      setError(err.response?.data?.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      alert('Task title cannot be empty.');
      return;
    }
    try {
      await taskApi.createTask({
        projectId,
        title: newTaskTitle,
        description: newTaskDescription,
        assignedTo: newTaskAssignedTo || null,
        dueDate: newTaskDueDate || null,
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAssignedTo('');
      setNewTaskDueDate('');
      fetchProjectDetails(); // Refresh project data to get new task
    } catch (err) {
      console.error("Failed to create task:", err);
      setError(err.response?.data?.message || "Failed to create task.");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberId) return;
    try {
      await projectApi.addProjectMember(projectId, newMemberId);
      setNewMemberId('');
      fetchProjectDetails();
    } catch (err) {
      console.error("Failed to add member:", err);
      setError(err.response?.data?.message || "Failed to add member.");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await projectApi.removeProjectMember(projectId, memberId);
      fetchProjectDetails();
    } catch (err) {
      console.error("Failed to remove member:", err);
      setError(err.response?.data?.message || "Failed to remove member.");
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      await projectApi.deleteProject(projectId);
      navigate('/projects'); // Redirect to projects list
    } catch (err) {
      console.error("Failed to delete project:", err);
      setError(err.response?.data?.message || "Failed to delete project.");
    }
  };


  if (loading) return <div className="loading-message">Loading project details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!project) return <div className="info-message">Project not found.</div>;

  const availableMembersForAssignee = [{ id: '', name: 'Unassigned' }, ...members, { id: project.ownerId, name: project.owner.name }];
  const availableUsersToAdd = allUsers.filter(u =>
    !members.some(m => m.id === u.id) && u.id !== project.ownerId
  );

  return (
    <div className="project-detail-page">
      <h1>{project.name} <span className={`project-status-${project.status.toLowerCase()}`}>{project.status}</span></h1>
      <p><strong>Description:</strong> {project.description}</p>
      <p><strong>Owner:</strong> {project.owner.name} ({project.owner.email})</p>
      {project.startDate && <p><strong>Start Date:</strong> {moment(project.startDate).format('YYYY-MM-DD')}</p>}
      {project.endDate && <p><strong>End Date:</strong> {moment(project.endDate).format('YYYY-MM-DD')}</p>}

      {isOwner && (
        <button className="delete-project-btn" onClick={handleDeleteProject}>Delete Project</button>
      )}

      <section className="project-members-section">
        <h2>Members</h2>
        <div className="member-list">
          {members.map(member => (
            <div key={member.id} className="member-item">
              <span>{member.name} ({member.email})</span>
              {isOwner && member.id !== project.ownerId && (
                <button onClick={() => handleRemoveMember(member.id)} className="remove-member-btn">Remove</button>
              )}
            </div>
          ))}
          {members.length === 0 && <p>No members yet (excluding owner).</p>}
        </div>
        {isOwner && (
          <form onSubmit={handleAddMember} className="add-member-form">
            <select
              value={newMemberId}
              onChange={(e) => setNewMemberId(e.target.value)}
              required
            >
              <option value="">Select User to Add</option>
              {availableUsersToAdd.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <button type="submit">Add Member</button>
          </form>
        )}
      </section>

      <section className="project-tasks-section">
        <h2>Tasks</h2>
        {isMember && (
          <form onSubmit={handleCreateTask} className="create-task-form">
            <h3>Create New Task</h3>
            <input
              type="text"
              placeholder="Task Title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Task Description (optional)"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
            ></textarea>
            <select
              value={newTaskAssignedTo}
              onChange={(e) => setNewTaskAssignedTo(e.target.value)}
            >
              <option value="">Assignee (Optional)</option>
              {availableMembersForAssignee.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
            />
            <button type="submit">Add Task</button>
          </form>
        )}

        <div className="task-list">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskCard key={task.id} task={task} projectId={projectId} />
            ))
          ) : (
            <p>No tasks yet for this project.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default ProjectDetailPage;
```