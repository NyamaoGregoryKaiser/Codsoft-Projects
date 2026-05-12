```javascript
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getContentTypes, deleteContentType } from '../api/contentTypes';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal'; // Assuming you have a Modal component

const ContentTypes = () => {
  const [contentTypes, setContentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { userRole } = useAuth();
  const canManageContentTypes = userRole === 'admin';

  useEffect(() => {
    fetchContentTypes();
  }, []);

  const fetchContentTypes = async () => {
    setLoading(true);
    try {
      const { results } = await getContentTypes();
      setContentTypes(results);
    } catch (error) {
      toast.error('Failed to fetch content types.');
      console.error('Error fetching content types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteContentType(deletingId);
      toast.success('Content type deleted successfully!');
      fetchContentTypes(); // Re-fetch list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete content type.');
      console.error('Error deleting content type:', error);
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Content Types</h1>
        {canManageContentTypes && (
          <Link to="/content-types/new">
            <Button className="flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" /> Create New
            </Button>
          </Link>
        )}
      </div>

      {contentTypes.length === 0 ? (
        <p className="text-gray-600">No content types defined yet.</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {contentTypes.map((type) => (
              <li key={type.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                <div>
                  <Link to={`/content-types/${type.id}/entries`} className="text-lg font-medium text-primary hover:underline">
                    {type.name}
                  </Link>
                  <p className="text-sm text-gray-500">Slug: {type.slug}</p>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Link to={`/content-types/${type.id}`}>
                    <Button variant="secondary" size="sm" title="Edit Content Type" disabled={!canManageContentTypes}>
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(type.id)}
                    title="Delete Content Type"
                    disabled={!canManageContentTypes}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Content Type"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="mr-2">
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deletingId && !showDeleteModal ? true : false}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-gray-700">Are you sure you want to delete this content type? This action cannot be undone. <br/> **Note: You can only delete content types that have no entries associated with them.**</p>
      </Modal>
    </div>
  );
};

export default ContentTypes;
```