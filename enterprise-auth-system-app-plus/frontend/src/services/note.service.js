import api from '../api/api';

const NOTE_URL = '/notes';

const createNote = async (noteData) => {
  try {
    const response = await api.post(NOTE_URL, noteData);
    return response.data;
  } catch (error) {
    console.error('Failed to create note:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

const getNoteById = async (id) => {
  try {
    const response = await api.get(`${NOTE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get note with ID ${id}:`, error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

const getMyNotes = async () => {
  try {
    const response = await api.get(`${NOTE_URL}/my-notes`);
    return response.data;
  } catch (error) {
    console.error('Failed to get my notes:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

const getAllNotes = async () => { // Admin only
  try {
    const response = await api.get(`${NOTE_URL}/all`);
    return response.data;
  } catch (error) {
    console.error('Failed to get all notes:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

const updateNote = async (id, noteData) => {
  try {
    const response = await api.put(`${NOTE_URL}/${id}`, noteData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update note with ID ${id}:`, error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

const deleteNote = async (id) => {
  try {
    const response = await api.delete(`${NOTE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete note with ID ${id}:`, error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

const noteService = {
  createNote,
  getNoteById,
  getMyNotes,
  getAllNotes,
  updateNote,
  deleteNote,
};

export default noteService;