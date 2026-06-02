import api from './api';

const PROJECTS_API_URL = '/projects';

export const getAllProjects = () => {
  return api.get(PROJECTS_API_URL);
};

export const getProjectById = (id) => {
  return api.get(`${PROJECTS_API_URL}/${id}`);
};

export const createProject = (projectData) => {
  return api.post(PROJECTS_API_URL, projectData);
};

export const updateProject = (id, projectData) => {
  return api.put(`${PROJECTS_API_URL}/${id}`, projectData);
};

export const deleteProject = (id) => {
  return api.delete(`${PROJECTS_API_URL}/${id}`);
};