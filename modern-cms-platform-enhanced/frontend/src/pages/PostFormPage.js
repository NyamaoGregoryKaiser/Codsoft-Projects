```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPost, getPost, updatePost, getCategories, getTags, uploadFeaturedImage } from '../api/posts';
import { useAuth } from '../contexts/AuthContext';

function PostFormPage() {
  const { id } = useParams(); // For editing existing post
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState('draft');
  const [featuredImage, setFeaturedImage] = useState(null); // File object for upload
  const [featuredImageUrl, setFeaturedImageUrl] = useState(''); // Current image URL from DB
  const [categoryId, setCategoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isEditing = !!id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, ts] = await Promise.all([getCategories(), getTags()]);
        setCategories(cats);
        setTags(ts);

        if (isEditing) {
          const postData = await getPost(id); // Fetch post for editing
          if (postData.authorId !== user.id && user.role !== 'admin') {
              setError('You are not authorized to edit this post.');
              setLoading(false);
              return;
          }
          setTitle(postData.title);
          setContent(postData.content);
          setExcerpt(postData.excerpt || '');
          setStatus(postData.status);
          setCategoryId(postData.category?.id || '');
          setSelectedTagIds(postData.tags?.map(tag => tag.id) || []);
          if (postData.featuredImage) {
              setFeaturedImageUrl(`${process.env.REACT_APP_API_BASE_URL}${postData.featuredImage}`);
          }
        }
      } catch (err) {
        setError('Failed to load data for form.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing, user]);

  const handleFileChange = (e) => {
    setFeaturedImage(e.target.files[0]);
  };

  const handleTagChange = (e) => {
    const { options } = e.target;
    const value = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    setSelectedTagIds(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const postData = {
      title,
      content,
      excerpt,
      status,
      categoryId: categoryId || null, // Ensure empty string becomes null
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : null,
    };

    try {
      let response;
      if (isEditing) {
        response = await updatePost(id, postData);
      } else {
        response = await createPost(postData);
      }

      // If a new image file is selected, upload it
      if (featuredImage) {
        const uploadResponse = await uploadFeaturedImage(response.post.id, featuredImage);
        // Optionally update the post again to save the new image URL
        await updatePost(response.post.id, { featuredImage: uploadResponse.imageUrl });
      }
      
      setSuccess(`Post ${isEditing ? 'updated' : 'created'} successfully!`);
      navigate('/dashboard'); // Redirect to dashboard
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} post.`);
      console.error(err);
    }
  };

  if (loading) {
    return <div className="form-container">Loading form...</div>;
  }

  if (error && !isEditing) { // If error during initial data fetch for new post
    return <div className="form-container error-message">{error}</div>;
  }

  if (error && isEditing && error.includes('authorized')) {
    return <div className="form-container error-message">{error}</div>;
  }

  return (
    <div className="form-container">
      <h2>{isEditing ? 'Edit Post' : 'Create New Post'}</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">Content:</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="excerpt">Excerpt:</label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="status">Status:</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="category">Category:</label>
          <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="tags">Tags (Ctrl/Cmd + click to select multiple):</label>
          <select id="tags" multiple value={selectedTagIds} onChange={handleTagChange} style={{minHeight: '100px'}}>
            {tags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="featuredImage">Featured Image:</label>
          <input type="file" id="featuredImage" accept="image/*" onChange={handleFileChange} />
          {featuredImageUrl && !featuredImage && (
              <img src={featuredImageUrl} alt="Current Featured" className="featured-image-preview" />
          )}
          {featuredImage && (
              <img src={URL.createObjectURL(featuredImage)} alt="New Featured" className="featured-image-preview" />
          )}
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {isEditing ? 'Update Post' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostFormPage;
```