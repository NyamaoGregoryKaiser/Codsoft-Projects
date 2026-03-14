```javascript
/**
 * @file API calls related to chat rooms and messages.
 * @module api/chatApi
 */

import api from './axiosConfig';

export const createRoom = async (roomData) => {
    const response = await api.post('/rooms', roomData);
    return response.data;
};

export const getRooms = async () => {
    const response = await api.get('/rooms');
    return response.data;
};

export const getRoomDetails = async (roomId) => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
};

export const joinRoom = async (roomId) => {
    const response = await api.post(`/rooms/${roomId}/join`);
    return response.data;
};

export const leaveRoom = async (roomId) => {
    const response = await api.post(`/rooms/${roomId}/leave`);
    return response.data;
};

export const getRoomMessages = async (roomId, limit = 50, offset = 0) => {
    const response = await api.get(`/rooms/${roomId}/messages`, {
        params: { limit, offset },
    });
    return response.data;
};

export const sendMessageHttp = async (roomId, content) => {
    const response = await api.post('/messages', { roomId, content });
    return response.data;
};
```