```javascript
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEntries, deleteEntry } from '../api/entries';
import { getContentType } from '../api/contentTypes';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal';

const EntriesList = () => {
  const { contentTypeId } = useParams();
  const [contentType, setContentType] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { userRole } = useAuth();
  const canManageEntries = userRole === 'admin' || userRole === 'editor';

  useEffect(() => {
    fetchContentTypeAndEntries();
  }, [contentTypeId]);

  const fetchContentTypeAndEntries = async () => {
    setLoading(true);
    try {
      const typeData = await getContentType(contentTypeId);
      setContentType(typeData);
      const { results } = await getEntries(contentTypeId);
      setEntries(results);
    } catch (error) {
      toast.error('Failed to load content type or entries.');
      console.error('Error fetching data:', error);
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
      await deleteEntry(contentTypeId, deletingId);
      toast.success('Entry deleted successfully!');
      fetchContentTypeAndEntries(); // Re-fetch list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete entry.');
      console.error('Error deleting entry:', error);
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  if (!contentType) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Entries</h1>
        <p className="text-red-600">Content Type not found.</p>
      </div>
    );
  }

  // Determine which field to use as the "title" for the entry list
  const titleField = contentType.fields.find(
    (field) => field.name === 'title' || field.name === 'name' || field.type === 'text'
  ) || contentType.fields[0]; // Fallback to the first field

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{contentType.name} Entries</h1>
        {canManageEntries && (
          <Link to={`/content-types/${contentTypeId}/entries/new`}>
            <Button className="flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" /> Add New Entry
            </Button>
          </Link>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-gray-600">No entries for this content type yet.</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {entries.map((entry) => (
              <li key={entry.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                <div>
                  <Link to={`/content-types/${contentTypeId}/entries/${entry.id}`} className="text-lg font-medium text-primary hover:underline">
                    {titleField ? (entry.data[titleField.name] || `Untitled Entry (${entry.id.substring(0, 8)})`) : `Entry (${entry.id.substring(0, 8)})`}
                  </Link>
                  <p className="text-sm text-gray-500">Status: <span className={`capitalize ${entry.status === 'published' ? 'text-green-600' : 'text-yellow-600'}`}>{entry.status}</span></p>
                  <p className="text-sm text-gray-600">Created: {new Date(entry.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-2">
                  <Link to={`/content-types/${contentTypeId}/entries/${entry.id}`}>
                    <Button variant="secondary" size="sm" title="Edit Entry" disabled={!canManageEntries}>
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(entry.id)}
                    title="Delete Entry"
                    disabled={!canManageEntries}
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
        title="Delete Entry"
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
        <p className="text-gray-700">Are you sure you want to delete this entry? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default EntriesList;
```