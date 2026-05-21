import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, UserIcon, TagIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import Button from './ui/Button';

const TaskCard = ({ task, onEdit, onDelete, currentUser }) => {
  if (!task) return null;

  // Determine if the current user can perform actions on the task
  const isCreator = currentUser?.id === task.creator_id;
  const isAssignee = currentUser?.id === task.assignee_id;
  const isProjectOwner = currentUser?.id === task.project?.owner_id;
  const isSuperuser = currentUser?.is_superuser;

  const canEdit = isCreator || isProjectOwner || isSuperuser || (isAssignee && task.status !== 'Done'); // Assignee can update if not done
  const canDelete = isCreator || isProjectOwner || isSuperuser;

  const getStatusColor = (status) => {
    switch (status) {
      case 'To Do':
        return 'bg-gray-200 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Done':
        return 'bg-green-100 text-green-800';
      case 'Blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low':
        return 'text-green-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'High':
        return 'text-orange-600';
      case 'Critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col h-full">
      <div className="p-5 flex-grow">
        <Link to={`/tasks/${task.id}`} className="block">
          <h3 className="text-xl font-semibold text-gray-800 hover:text-primary transition-colors duration-200 mb-2">
            {task.title}
          </h3>
        </Link>
        <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
          <span className={`px-2 py-1 rounded-full ${getStatusColor(task.status)} font-medium`}>
            {task.status}
          </span>
          <span className={`px-2 py-1 rounded-full bg-gray-100 ${getPriorityColor(task.priority)} font-medium`}>
            {task.priority}
          </span>
          {task.project && (
            <Link to={`/projects/${task.project.id}`} className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium hover:bg-indigo-200">
              {task.project.name}
            </Link>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {task.description || 'No description provided.'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
          <div className="flex items-center">
            <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
            <span>Creator: {task.creator?.username || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
            <span>Assignee: {task.assignee?.username || 'Unassigned'}</span>
          </div>
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
            <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
          </div>
          <div className="flex items-center">
            <ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-1 text-gray-400" />
            <span>{task.comments?.length || 0} Comments</span>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-4 flex justify-end items-center border-t space-x-2">
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(task)} className="text-sm">
            Edit
          </Button>
        )}
        {canDelete && (
          <Button variant="danger" size="sm" onClick={() => onDelete(task.id)} className="text-sm">
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;