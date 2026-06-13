import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPost, getPost, updatePost, getCategories, getMediaFiles } from '../api/api';
import ContentEditor from '../components/ContentEditor'; // Custom simple content editor
import AuthContext from '../utils/AuthContext';
import { useContext } from 'react';

const PostCreateEditPage = () => {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [categoryId, setCategoryId] = useState('');
  const [featuredImageId, setFeaturedImageId] = useState('');
  const [categories, setCategories] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const categoriesRes = await getCategories();
        setCategories(categoriesRes.data.data);

        // Fetch media files (only if user can manage media)
        if (user && ['admin', 'editor', 'author'].includes(user.role)) {
            const mediaRes = await getMediaFiles();
            setMediaFiles(mediaRes.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dropdown data:', err);
        setError('Failed to load categories or media.');
      }
    };

    fetchDropdownData();

    if (id) {
      setIsEditing(true);
      setLoading(true);
      getPost(id)
        .then(response => {
          const post = response.data.data;
          setTitle(post.title);
          setSlug(post.slug);
          setContent(post.content);
          setStatus(post.status);
          setCategoryId(post.categoryId || '');
          setFeaturedImageId(post.featuredImageId || '');

          // Authorization check: Only author/editor/admin can edit
          if (user.role !== 'admin' && user.role !== 'editor' && user.id !== post.authorId) {
            setError("You don't have permission to edit this post.");
            navigate('/admin/posts'); // Redirect if unauthorized
          }
        })
        .catch(err => {
          console.error('Failed to fetch post:', err);
          setError(err.response?.data?.message || 'Failed to load post for editing.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, user, navigate]);

  const generateSlug = (postTitle) => {
    return postTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!isEditing || !slug) { // Only auto-generate slug on create or if not manually set in edit
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const postData = {
      title,
      slug: slug || generateSlug(title), // Ensure slug is present
      content,
      status,
      categoryId: categoryId || null,
      featuredImageId: featuredImageId || null,
    };

    try {
      if (isEditing) {
        await updatePost(id, postData);
        alert('Post updated successfully!');
      } else {
        await createPost(postData);
        alert('Post created successfully!');
      }
      navigate('/admin/posts');
    } catch (err) {
      console.error('Post operation failed:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to save post.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center text-gray-600">Loading post data...</div>;
  if (error && error !== "You don't have permission to edit this post.") return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {isEditing ? 'Edit Post' : 'Create New Post'}
      </h1>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title:</label>
          <input
            type="text"
            id="title"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={title}
            onChange={handleTitleChange}
            required
            disabled={error === "You don't have permission to edit this post."}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="slug" className="block text-gray-700 text-sm font-bold mb-2">Slug:</label>
          <input
            type="text"
            id="slug"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={loading || error === "You don't have permission to edit this post."}
          />
        </div>

        <ContentEditor content={content} onContentChange={setContent} />

        <div className="mb-4">
          <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Status:</label>
          <select
            id="status"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={loading || error === "You don't have permission to edit this post."}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">Category:</label>
          <select
            id="category"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={loading || error === "You don't have permission to edit this post."}
          >
            <option value="">No Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="featuredImage" className="block text-gray-700 text-sm font-bold mb-2">Featured Image:</label>
          <select
            id="featuredImage"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={featuredImageId}
            onChange={(e) => setFeaturedImageId(e.target.value)}
            disabled={loading || error === "You don't have permission to edit this post."}
          >
            <option value="">No Featured Image</option>
            {mediaFiles.map(media => (
              <option key={media.id} value={media.id}>{media.originalname}</option>
            ))}
          </select>
          {featuredImageId && (
            <div className="mt-2">
              <img src={`${process.env.REACT_APP_API_BASE_URL.replace('/api', '')}${mediaFiles.find(m => m.id === featuredImageId)?.filepath}`} alt="Featured" className="max-w-xs h-auto rounded-md shadow" />
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1">
            <Link to="/admin/media" className="text-blue-500 hover:underline">Upload/Manage Media</Link>
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading || error === "You don't have permission to edit this post."}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Post' : 'Create Post')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostCreateEditPage;