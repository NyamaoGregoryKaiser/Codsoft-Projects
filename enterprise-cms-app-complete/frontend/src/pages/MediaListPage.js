import React, { useState, useEffect, useRef } from 'react';
import { getMediaFiles, uploadMedia, deleteMedia } from '../api/api';

const MediaListPage = () => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchMedia = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMediaFiles();
      setMediaFiles(response.data.data);
    } catch (err) {
      console.error('Failed to fetch media:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load media files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('media', file); // 'media' is the field name expected by the backend middleware

    try {
      await uploadMedia(formData);
      alert('File uploaded successfully!');
      fetchMedia(); // Refresh media list
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input
    } catch (err) {
      console.error('File upload failed:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to upload file. Check size and type.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId, filename) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      setError('');
      try {
        await deleteMedia(mediaId);
        fetchMedia(); // Refresh list after deletion
      } catch (err) {
        console.error('Failed to delete media:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to delete media file.');
      }
    }
  };

  const getFullFileUrl = (filepath) => {
    const apiBase = process.env.REACT_APP_API_BASE_URL;
    return `${apiBase.replace('/api', '')}${filepath}`;
  };


  if (loading) return <div className="text-center text-gray-600">Loading media library...</div>;
  if (error && !uploading) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Media Library</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Upload New Media</h2>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {uploading && <p className="mt-2 text-blue-600">Uploading...</p>}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Existing Media Files</h2>
        {mediaFiles.length === 0 ? (
          <p className="text-gray-600">No media files uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaFiles.map((media) => (
              <div key={media.id} className="border rounded-lg p-3 shadow-sm flex flex-col items-center">
                {media.mimetype.startsWith('image/') ? (
                  <img src={getFullFileUrl(media.filepath)} alt={media.originalname} className="max-w-full h-32 object-contain mb-2 rounded-md" />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded-md text-gray-500 text-sm overflow-hidden">
                    <span className="break-all px-2">{media.originalname}</span>
                  </div>
                )}
                <p className="text-sm font-medium text-gray-800 break-words w-full text-center mt-2">{media.originalname}</p>
                <p className="text-xs text-gray-500">{Math.round(media.size / 1024)} KB</p>
                <button
                  onClick={() => handleDeleteMedia(media.id, media.originalname)}
                  className="mt-3 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaListPage;