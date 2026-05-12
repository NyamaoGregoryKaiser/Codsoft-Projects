```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { getContentType, createContentType, updateContentType } from '../api/contentTypes';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import slugify from 'slugify'; // You might need to install slugify: `npm install slugify`

const fieldTypeOptions = [
  { value: 'text', label: 'Text' },
  { value: 'richtext', label: 'Rich Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'media', label: 'Media (URL)' },
  { value: 'relation', label: 'Relation (UUID)' },
];

const ContentTypeForm = () => {
  const { contentTypeId } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isEditMode = !!contentTypeId;
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      fields: [{ name: '', label: '', type: 'text', required: false, unique: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });

  const watchFields = watch('fields');

  useEffect(() => {
    if (isEditMode) {
      const fetchContentType = async () => {
        try {
          const data = await getContentType(contentTypeId);
          reset(data);
        } catch (error) {
          toast.error('Failed to load content type for editing.');
          console.error('Error fetching content type:', error);
          navigate('/content-types');
        } finally {
          setLoading(false);
        }
      };
      fetchContentType();
    }
  }, [contentTypeId, isEditMode, reset, navigate]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    // Basic frontend validation for field names uniqueness
    const fieldNames = new Set();
    let hasDuplicateFields = false;
    data.fields.forEach((field, index) => {
      if (fieldNames.has(field.name)) {
        setError(`fields.${index}.name`, { type: 'manual', message: 'Duplicate field name' });
        hasDuplicateFields = true;
      }
      fieldNames.add(field.name);
    });

    if (hasDuplicateFields) {
      toast.error('Field names must be unique within a content type.');
      setSubmitting(false);
      return;
    }
    
    // Ensure all fields have a label, if not provided, use name as label
    const cleanedFields = data.fields.map(field => ({
      ...field,
      label: field.label || field.name,
      // Ensure targetContentType is present for 'relation' type, and removed for others
      ...(field.type === 'relation' ? { targetContentType: field.targetContentType } : { targetContentType: undefined })
    }));

    try {
      if (isEditMode) {
        await updateContentType(contentTypeId, { ...data, fields: cleanedFields });
        toast.success('Content type updated successfully!');
      } else {
        await createContentType({ ...data, fields: cleanedFields });
        toast.success('Content type created successfully!');
      }
      navigate('/content-types');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Something went wrong.';
      toast.error(errorMessage);
      console.error('Error saving content type:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const generateSlug = () => {
    const name = watch('name');
    if (name) {
      const generatedSlug = slugify(name, { lower: true, strict: true });
      control.setValue('slug', generatedSlug);
      clearErrors('slug'); // Clear any previous slug errors
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  if (userRole !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-700">You do not have permission to manage content types.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Edit Content Type' : 'Create New Content Type'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Name"
          id="name"
          placeholder="e.g., Blog Post"
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message}
        />
        <div className="flex items-end space-x-2">
          <Input
            label="Slug"
            id="slug"
            placeholder="e.g., blog-post"
            className="flex-grow"
            {...register('slug', {
              required: 'Slug is required',
              pattern: {
                value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message: 'Slug must be lowercase alphanumeric with hyphens (e.g., "my-content-type")'
              }
            })}
            error={errors.slug?.message}
          />
          <Button type="button" onClick={generateSlug} variant="secondary">
            Generate Slug
          </Button>
        </div>
        <Input
          label="Description"
          id="description"
          placeholder="A brief description of this content type"
          {...register('description')}
          error={errors.description?.message}
        />

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Fields</h2>
        <div className="space-y-4">
          {fields.map((item, index) => (
            <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Field Name"
                  placeholder="e.g., title"
                  {...register(`fields.${index}.name`, {
                    required: 'Field name is required',
                    pattern: {
                      value: /^[a-zA-Z0-9]+$/,
                      message: 'Alphanumeric only'
                    }
                  })}
                  error={errors.fields?.[index]?.name?.message}
                  // Force label generation if user doesn't provide
                  onBlur={(e) => {
                    const currentField = watchFields[index];
                    if (!currentField.label && e.target.value) {
                      control.setValue(`fields.${index}.label`, e.target.value);
                    }
                  }}
                />
                <Input
                  label="Field Label (Optional)"
                  placeholder="e.g., Title of Post"
                  {...register(`fields.${index}.label`)}
                  error={errors.fields?.[index]?.label?.message}
                />
                <Select
                  label="Type"
                  options={fieldTypeOptions}
                  {...register(`fields.${index}.type`, { required: 'Type is required' })}
                  error={errors.fields?.[index]?.type?.message}
                  value={watchFields[index].type}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-primary rounded"
                    {...register(`fields.${index}.required`)}
                  />
                  <span className="ml-2">Required</span>
                </label>
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-primary rounded"
                    {...register(`fields.${index}.unique`)}
                  />
                  <span className="ml-2">Unique</span>
                </label>
              </div>
              <Button type="button" variant="danger" size="sm" onClick={() => remove(index)}>
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" onClick={() => append({ name: '', label: '', type: 'text', required: false, unique: false })} className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" /> Add Field
        </Button>

        <div className="mt-8 flex justify-end space-x-4">
          <Button type="button" variant="secondary" onClick={() => navigate('/content-types')}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditMode ? 'Update Content Type' : 'Create Content Type'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContentTypeForm;
```