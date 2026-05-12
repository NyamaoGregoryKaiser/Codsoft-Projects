```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getContentType } from '../api/contentTypes';
import { getEntry, createEntry, updateEntry } from '../api/entries';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

const EntryForm = () => {
  const { contentTypeId, entryId } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isEditMode = !!entryId;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contentType, setContentType] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: 'draft',
      data: {},
    },
  });

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const typeData = await getContentType(contentTypeId);
        setContentType(typeData);

        if (isEditMode) {
          const entryData = await getEntry(contentTypeId, entryId);
          reset({
            status: entryData.status,
            data: entryData.data,
          });
        }
      } catch (error) {
        toast.error('Failed to load form data.');
        console.error('Error fetching form data:', error);
        navigate(`/content-types/${contentTypeId}/entries`);
      } finally {
        setLoading(false);
      }
    };
    fetchFormData();
  }, [contentTypeId, entryId, isEditMode, reset, navigate]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (isEditMode) {
        await updateEntry(contentTypeId, entryId, formData);
        toast.success('Entry updated successfully!');
      } else {
        await createEntry(contentTypeId, formData);
        toast.success('Entry created successfully!');
      }
      navigate(`/content-types/${contentTypeId}/entries`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save entry.';
      toast.error(errorMessage);
      console.error('Error saving entry:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  if (!contentType) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Content Type Not Found</h1>
        <p className="text-gray-700">Please ensure the content type exists.</p>
      </div>
    );
  }

  if (userRole !== 'admin' && userRole !== 'editor') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-700">You do not have permission to manage entries.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {isEditMode ? `Edit ${contentType.name} Entry` : `Create New ${contentType.name} Entry`}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Select
          label="Status"
          id="status"
          options={[
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
            { value: 'archived', label: 'Archived' },
          ]}
          {...register('status', { required: 'Status is required' })}
          error={errors.status?.message}
        />

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Entry Data</h2>
        <div className="space-y-4">
          {contentType.fields.map((field) => (
            <div key={field.name}>
              {field.type === 'text' && (
                <Input
                  label={field.label || field.name}
                  id={`data.${field.name}`}
                  placeholder={`Enter ${field.label || field.name}`}
                  {...register(`data.${field.name}`, { required: field.required && `${field.label || field.name} is required` })}
                  error={errors.data?.[field.name]?.message}
                />
              )}
              {field.type === 'richtext' && (
                <div>
                  <label htmlFor={`data.${field.name}`} className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label || field.name}
                  </label>
                  <textarea
                    id={`data.${field.name}`}
                    rows="5"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    {...register(`data.${field.name}`, { required: field.required && `${field.label || field.name} is required` })}
                  ></textarea>
                  {errors.data?.[field.name]?.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.data?.[field.name]?.message}</p>
                  )}
                </div>
              )}
              {field.type === 'number' && (
                <Input
                  label={field.label || field.name}
                  id={`data.${field.name}`}
                  type="number"
                  placeholder={`Enter ${field.label || field.name}`}
                  {...register(`data.${field.name}`, {
                    required: field.required && `${field.label || field.name} is required`,
                    valueAsNumber: true,
                  })}
                  error={errors.data?.[field.name]?.message}
                />
              )}
              {field.type === 'boolean' && (
                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id={`data.${field.name}`}
                    className="form-checkbox h-5 w-5 text-primary rounded"
                    {...register(`data.${field.name}`)}
                  />
                  <label htmlFor={`data.${field.name}`} className="ml-2 block text-sm font-medium text-gray-700">
                    {field.label || field.name}
                  </label>
                </div>
              )}
              {field.type === 'date' && (
                <Input
                  label={field.label || field.name}
                  id={`data.${field.name}`}
                  type="date"
                  {...register(`data.${field.name}`, { required: field.required && `${field.label || field.name} is required` })}
                  error={errors.data?.[field.name]?.message}
                />
              )}
              {field.type === 'media' && (
                <Input
                  label={field.label || field.name}
                  id={`data.${field.name}`}
                  placeholder="Enter media URL"
                  {...register(`data.${field.name}`, { required: field.required && `${field.label || field.name} is required` })}
                  error={errors.data?.[field.name]?.message}
                />
              )}
              {field.type === 'relation' && (
                <Input
                  label={`${field.label || field.name} (Related Entry ID)`}
                  id={`data.${field.name}`}
                  placeholder="Enter related entry UUID"
                  {...register(`data.${field.name}`, { required: field.required && `${field.label || field.name} is required` })}
                  error={errors.data?.[field.name]?.message}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <Button type="button" variant="secondary" onClick={() => navigate(`/content-types/${contentTypeId}/entries`)}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditMode ? 'Update Entry' : 'Create Entry'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EntryForm;
```