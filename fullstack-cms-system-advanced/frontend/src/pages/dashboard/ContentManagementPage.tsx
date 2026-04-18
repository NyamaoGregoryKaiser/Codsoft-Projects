import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';
import { Content, ContentStatus, Category, Tag, CreateContentDto, UpdateContentDto } from '../../types';
import { getAllContentAdmin, createContent, updateContent, deleteContent, getCategories, getTags } from '../../api/content.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';

const contentSchema = Yup.object().shape({
  title: Yup.string().min(5, 'Too Short!').max(255, 'Too Long!').required('Required'),
  slug: Yup.string().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-friendly').optional(),
  body: Yup.string().min(10, 'Too Short!').required('Required'),
  status: Yup.string().oneOf(Object.values(ContentStatus)).required('Required'),
  categoryId: Yup.string().uuid('Invalid Category ID').nullable().optional(),
  tagIds: Yup.array().of(Yup.string().uuid('Invalid Tag ID')).optional(),
});

export const ContentManagementPage: React.FC = () => {
  const { loading, isAdmin, isEditor } = useAuth();
  useAuthRedirect({
    redirectIfUnauthenticatedTo: '/login',
    allowedRoles: ['admin', 'editor'],
    redirectIfUnauthorizedTo: '/dashboard',
  });

  const [contentList, setContentList] = useState<Content[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [editContentId, setEditContentId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchContentData = async () => {
    try {
      const content = await getAllContentAdmin();
      setContentList(content);
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories);
      const fetchedTags = await getTags();
      setTags(fetchedTags);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setFormError(error.response?.data?.message || 'Failed to load content, categories or tags.');
    }
  };

  useEffect(() => {
    if (!loading && (isAdmin || isEditor)) {
      fetchContentData();
    }
  }, [loading, isAdmin, isEditor]);

  const formik = useFormik({
    initialValues: {
      title: '',
      slug: '',
      body: '',
      status: ContentStatus.DRAFT,
      categoryId: null,
      tagIds: [],
    } as CreateContentDto | UpdateContentDto,
    validationSchema: contentSchema,
    onSubmit: async (values) => {
      setFormError(null);
      try {
        if (editContentId) {
          await updateContent(editContentId, values as UpdateContentDto);
        } else {
          await createContent(values as CreateContentDto);
        }
        await fetchContentData();
        formik.resetForm();
        setEditContentId(null);
      } catch (err: any) {
        setFormError(err.response?.data?.message || 'Operation failed.');
        console.error('Content operation failed:', err);
      }
    },
  });

  const handleEditClick = (content: Content) => {
    setEditContentId(content.id);
    formik.setValues({
      title: content.title,
      slug: content.slug,
      body: content.body,
      status: content.status,
      categoryId: content.category?.id || null,
      tagIds: content.tags.map(tag => tag.id),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await deleteContent(id);
        await fetchContentData();
      } catch (err: any) {
        setFormError(err.response?.data?.message || 'Failed to delete content.');
        console.error('Delete content failed:', err);
      }
    }
  };

  if (loading || (!isAdmin && !isEditor)) {
    return <div className="text-center mt-8">Loading or unauthorized...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{editContentId ? 'Edit Content' : 'Create New Content'}</h1>

      {formError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{formError}</span>
        </div>
      )}

      <form onSubmit={formik.handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <Input
          id="title"
          name="title"
          label="Title"
          value={formik.values.title}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.title && formik.errors.title ? formik.errors.title : undefined}
          placeholder="Enter content title"
        />
        <Input
          id="slug"
          name="slug"
          label="Slug (Optional, auto-generated if empty)"
          value={formik.values.slug}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.slug && formik.errors.slug ? formik.errors.slug : undefined}
          placeholder="my-content-slug"
        />
        <div className="mb-4">
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">Body</label>
          <textarea
            id="body"
            name="body"
            className={`w-full px-3 py-2 border ${formik.touched.body && formik.errors.body ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            rows={10}
            value={formik.values.body}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Write your content here..."
          ></textarea>
          {formik.touched.body && formik.errors.body && <p className="mt-1 text-sm text-red-600">{formik.errors.body}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            id="status"
            name="status"
            className={`w-full px-3 py-2 border ${formik.touched.status && formik.errors.status ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            value={formik.values.status}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {Object.values(ContentStatus).map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          {formik.touched.status && formik.errors.status && <p className="mt-1 text-sm text-red-600">{formik.errors.status}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">Category (Optional)</label>
          <select
            id="categoryId"
            name="categoryId"
            className={`w-full px-3 py-2 border ${formik.touched.categoryId && formik.errors.categoryId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            value={formik.values.categoryId || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            <option value="">-- Select Category --</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {formik.touched.categoryId && formik.errors.categoryId && <p className="mt-1 text-sm text-red-600">{formik.errors.categoryId}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="tagIds" className="block text-sm font-medium text-gray-700 mb-1">Tags (Multi-select, Optional)</label>
          <select
            id="tagIds"
            name="tagIds"
            multiple
            className={`w-full px-3 py-2 border ${formik.touched.tagIds && formik.errors.tagIds ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            value={formik.values.tagIds}
            onChange={(e) => formik.setFieldValue('tagIds', Array.from(e.target.selectedOptions, option => option.value))}
            onBlur={formik.handleBlur}
          >
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          {formik.touched.tagIds && formik.errors.tagIds && <p className="mt-1 text-sm text-red-600">{String(formik.errors.tagIds)}</p>}
        </div>

        <div className="flex space-x-2">
          <Button type="submit" disabled={formik.isSubmitting || !formik.isValid}>
            {editContentId ? 'Update Content' : 'Create Content'}
          </Button>
          {editContentId && (
            <Button type="button" variant="secondary" onClick={() => { formik.resetForm(); setEditContentId(null); setFormError(null); }}>
              Cancel Edit
            </Button>
          )}
        </div>
      </form>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">All Content</h2>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {contentList.length === 0 ? (
            <li className="px-4 py-4 sm:px-6 text-gray-500 text-center">No content found.</li>
          ) : (
            contentList.map((content) => (
              <li key={content.id} className="px-4 py-4 sm:px-6 flex justify-between items-center">
                <div>
                  <Link to={`/content/${content.slug}`} className="text-lg font-medium text-indigo-600 hover:text-indigo-900">
                    {content.title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    Status: <span className={`font-semibold ${content.status === ContentStatus.PUBLISHED ? 'text-green-600' : 'text-yellow-600'}`}>{content.status}</span> |
                    Category: {content.category?.name || 'N/A'}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button variant="secondary" onClick={() => handleEditClick(content)}>Edit</Button>
                  {isAdmin && ( // Only admin can delete
                    <Button variant="danger" onClick={() => handleDeleteClick(content.id)}>Delete</Button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};