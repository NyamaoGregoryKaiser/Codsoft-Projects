```javascript
import React, { useEffect, useState } from 'react';
import { 
  getCategories, createCategory, updateCategory, deleteCategory,
  getTags, createTag, updateTag, deleteTag
} from '../api/posts';

function CategoryTagManagementPage() {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryDesc, setEditingCategoryDesc] = useState('');
  const [editingTagId, setEditingTagId] = useState(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [catData, tagData] = await Promise.all([getCategories(), getTags()]);
      setCategories(catData);
      setTags(tagData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch categories and tags.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      await createCategory({ name: newCategoryName, description: newCategoryDesc });
      setNewCategoryName('');
      setNewCategoryDesc('');
      setSuccess('Category created successfully!');
      await fetchAllData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category.');
      console.error(err);
    }
  };

  const handleUpdateCategory = async (id) => {
    try {
      await updateCategory(id, { name: editingCategoryName, description: editingCategoryDesc });
      setEditingCategoryId(null);
      setSuccess('Category updated successfully!');
      await fetchAllData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update category.');
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? Posts associated with it will become uncategorized.')) {
      try {
        await deleteCategory(id);
        setSuccess('Category deleted successfully!');
        await fetchAllData();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete category.');
        console.error(err);
      }
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTagName) return;
    try {
      await createTag({ name: newTagName });
      setNewTagName('');
      setSuccess('Tag created successfully!');
      await fetchAllData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tag.');
      console.error(err);
    }
  };

  const handleUpdateTag = async (id) => {
    try {
      await updateTag(id, { name: editingTagName });
      setEditingTagId(null);
      setSuccess('Tag updated successfully!');
      await fetchAllData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update tag.');
      console.error(err);
    }
  };

  const handleDeleteTag = async (id) => {
    if (window.confirm('Are you sure you want to delete this tag? It will be removed from all posts.')) {
      try {
        await deleteTag(id);
        setSuccess('Tag deleted successfully!');
        await fetchAllData();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete tag.');
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="dashboard-container">Loading categories and tags...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Category & Tag Management</h1>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <div className="dashboard-section">
        <h2>Categories</h2>
        <form onSubmit={handleCreateCategory} className="form-inline">
          <input
            type="text"
            placeholder="New Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            required
            style={{marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
          />
          <input
            type="text"
            placeholder="Description (Optional)"
            value={newCategoryDesc}
            onChange={(e) => setNewCategoryDesc(e.target.value)}
            style={{marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
          />
          <button type="submit" className="btn-primary btn-small">Add Category</button>
        </form>

        <div className="dashboard-list">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td>
                    {editingCategoryId === cat.id ? (
                      <input 
                        type="text" 
                        value={editingCategoryName} 
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                      />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td>{cat.slug}</td>
                  <td>
                    {editingCategoryId === cat.id ? (
                      <input 
                        type="text" 
                        value={editingCategoryDesc} 
                        onChange={(e) => setEditingCategoryDesc(e.target.value)}
                      />
                    ) : (
                      cat.description
                    )}
                  </td>
                  <td className="actions">
                    {editingCategoryId === cat.id ? (
                      <>
                        <button onClick={() => handleUpdateCategory(cat.id)} className="btn-primary btn-small">Save</button>
                        <button onClick={() => setEditingCategoryId(null)} className="btn-delete btn-small">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            setEditingCategoryId(cat.id);
                            setEditingCategoryName(cat.name);
                            setEditingCategoryDesc(cat.description || '');
                          }} 
                          className="btn-edit btn-small"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="btn-delete btn-small">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-section" style={{marginTop: '30px'}}>
        <h2>Tags</h2>
        <form onSubmit={handleCreateTag} className="form-inline">
          <input
            type="text"
            placeholder="New Tag Name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            required
            style={{marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
          />
          <button type="submit" className="btn-primary btn-small">Add Tag</button>
        </form>

        <div className="dashboard-list">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map(tag => (
                <tr key={tag.id}>
                  <td>
                    {editingTagId === tag.id ? (
                      <input 
                        type="text" 
                        value={editingTagName} 
                        onChange={(e) => setEditingTagName(e.target.value)}
                      />
                    ) : (
                      tag.name
                    )}
                  </td>
                  <td>{tag.slug}</td>
                  <td className="actions">
                    {editingTagId === tag.id ? (
                      <>
                        <button onClick={() => handleUpdateTag(tag.id)} className="btn-primary btn-small">Save</button>
                        <button onClick={() => setEditingTagId(null)} className="btn-delete btn-small">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            setEditingTagId(tag.id);
                            setEditingTagName(tag.name);
                          }} 
                          className="btn-edit btn-small"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDeleteTag(tag.id)} className="btn-delete btn-small">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CategoryTagManagementPage;
```