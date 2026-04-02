import axios from './axiosConfig';

export const getContentList = async (params = {}) => {
    try {
        const response = await axios.get('/content/', { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching content list:", error.response?.data || error.message);
        throw error;
    }
};

export const getContentDetail = async (slug) => {
    try {
        const response = await axios.get(`/content/${slug}/`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching content detail for ${slug}:`, error.response?.data || error.message);
        throw error;
    }
};

export const createContent = async (contentData) => {
    try {
        const response = await axios.post('/content/', contentData);
        return response.data;
    } catch (error) {
        console.error("Error creating content:", error.response?.data || error.message);
        throw error;
    }
};

export const updateContent = async (slug, contentData) => {
    try {
        const response = await axios.patch(`/content/${slug}/`, contentData);
        return response.data;
    } catch (error) {
        console.error(`Error updating content ${slug}:`, error.response?.data || error.message);
        throw error;
    }
};

export const deleteContent = async (slug) => {
    try {
        await axios.delete(`/content/${slug}/`);
        return true;
    } catch (error) {
        console.error(`Error deleting content ${slug}:`, error.response?.data || error.message);
        throw error;
    }
};

export const getCategories = async () => {
    try {
        const response = await axios.get('/categories/');
        return response.data.results;
    } catch (error) {
        console.error("Error fetching categories:", error.response?.data || error.message);
        throw error;
    }
};

export const getTags = async () => {
    try {
        const response = await axios.get('/tags/');
        return response.data.results;
    } catch (error) {
        console.error("Error fetching tags:", error.response?.data || error.message);
        throw error;
    }
};

export const getComments = async (contentSlug) => {
    try {
        const response = await axios.get(`/content/${contentSlug}/comments/`);
        return response.data.results;
    } catch (error) {
        console.error("Error fetching comments:", error.response?.data || error.message);
        throw error;
    }
};

export const postComment = async (contentSlug, commentData) => {
    try {
        const response = await axios.post(`/content/${contentSlug}/comments/`, commentData);
        return response.data;
    } catch (error) {
        console.error("Error posting comment:", error.response?.data || error.message);
        throw error;
    }
};