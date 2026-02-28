```jsx
import React, { useEffect, useState } from 'react';
import { getAllContent, getContentById, createContent, updateContent, deleteContent, getCategories, getMedia, uploadMedia } from '../api/content';
import { useAuth } from '../context/AuthContext';

const ContentManagementPage = () => {
  const { userId } = useAuth();
  const [contentList, setContentList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null); // For editing
  const [form, setForm] = useState({
    title: '',
    slug: '',
    body: '',
    featuredImage: '',
    status: 'DRAFT',
    type: 'POST',
    categoryId: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const contentData = await getAllContent();
      setContentList(contentData.content);
      const categoriesData = await getCategories();
      setCategories(categoriesData);
      const mediaData = await getMedia();
      setMediaItems(mediaData);
    } catch (err) {
      setError('Failed to load data.');
      console.error("Error fetching content/categories/media:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    try {
      const uploaded = await uploadMedia(uploadFile);
      setMediaItems((prev) => [...prev, uploaded]);
      alert('File uploaded successfully!');
      setUploadFile(null); // Clear selected file
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('Failed to upload file.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (selectedContent) {
        await updateContent(selectedContent.id, { ...form, authorId: userId }); // userId is from AuthContext
        alert('Content updated successfully!');
      } else {
        await createContent({ ...form, authorId: userId });
        alert('Content created successfully!');
      }
      resetForm();
      fetchData(); // Refresh list
    } catch (err) {
      console.error('Failed to save content:', err);
      setError(err.response?.data?.message || 'Failed to save content.');
    }
  };

  const handleEdit = (content) => {
    setSelectedContent(content);
    setForm({
      title: content.title,
      slug: content.slug,
      body: content.body,
      featuredImage: content.featuredImage || '',
      status: content.status,
      type: content.type,
      categoryId: content.categoryId || ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await deleteContent(id);
        alert('Content deleted successfully!');
        fetchData();
      } catch (err) {
        console.error('Failed to delete content:', err);
        setError('Failed to delete content.');
      }
    }
  };

  const resetForm = () => {
    setSelectedContent(null);
    setForm({
      title: '',
      slug: '',
      body: '',
      featuredImage: '',
      status: 'DRAFT',
      type: 'POST',
      categoryId: ''
    });
  };

  if (loading) return <div>Loading admin data...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-page-container">
      <div className="sidebar">
        <nav>
          <Link to="/admin/content" className="active">Content</Link>
          <Link to="/admin/categories">Categories</Link> {/* Placeholder for Categories CRUD */}
          <Link to="/admin/users">Users</Link> {/* Placeholder for User Management */}
          <Link to="/admin/media">Media</Link> {/* Placeholder for Media Management */}
        </nav>
      </div>
      <div className="main-content">
        <h2>Content Management</h2>

        {/* Content Form */}
        <h3>{selectedContent ? 'Edit Content' : 'Create New Content'}</h3>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}
          <div>
            <label htmlFor="title">Title:</label>
            <input type="text" id="title" name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="slug">Slug (URL-friendly):</label>
            <input type="text" id="slug" name="slug" value={form.slug} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="body">Body:</label>
            <textarea id="body" name="body" value={form.body} onChange={handleChange} required rows="10"></textarea>
          </div>
          <div>
            <label htmlFor="featuredImage">Featured Image URL:</label>
            <input type="text" id="featuredImage" name="featuredImage" value={form.featuredImage} onChange={handleChange} />
            <p className="hint">Or upload a new image:</p>
            <input type="file" onChange={handleFileChange} />
            <button type="button" onClick={handleUpload} disabled={!uploadFile}>Upload Image</button>
            <p className="hint">Available Media:
              {mediaItems.map(m => (
                <span key={m.id} style={{marginRight: '10px', cursor: 'pointer', textDecoration: 'underline'}} onClick={() => setForm(p => ({...p, featuredImage: m.url}))}>
                  {m.fileName}
                </span>
              ))}
            </p>
          </div>
          <div>
            <label htmlFor="status">Status:</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div>
            <label htmlFor="type">Type:</label>
            <select id="type" name="type" value={form.type} onChange={handleChange}>
              <option value="POST">Post</option>
              <option value="PAGE">Page</option>
            </select>
          </div>
          <div>
            <label htmlFor="categoryId">Category:</label>
            <select id="categoryId" name="categoryId" value={form.categoryId} onChange={handleChange}>
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit">{selectedContent ? 'Update Content' : 'Create Content'}</button>
            <button type="button" onClick={resetForm} style={{backgroundColor: '#6c757d'}}>Cancel</button>
          </div>
        </form>

        {/* Content List */}
        <h3 style={{marginTop: '40px'}}>All Content</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Category</th>
              <th>Status</th>
              <th>Type</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contentList.map((content) => (
              <tr key={content.id}>
                <td>{content.id}</td>
                <td>{content.title}</td>
                <td>{content.authorName}</td>
                <td>{content.categoryName}</td>
                <td>{content.status}</td>
                <td>{content.type}</td>
                <td>{new Date(content.createdAt).toLocaleDateString()}</td>
                <td className="actions">
                  <button onClick={() => handleEdit(content)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(content.id)} className="delete-btn">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContentManagementPage;
```