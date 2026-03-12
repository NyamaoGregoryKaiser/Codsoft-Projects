import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Button, FormControl, FormLabel, Input, Textarea,
  Select, CheckboxGroup, Stack, Checkbox, useToast, Spinner, Center
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api';
import RichTextEditor from '../../components/ContentEditor/RichTextEditor';

const PostFormPage = () => {
  const { slug } = useParams(); // For editing existing posts
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'draft',
    category_ids: [],
    tag_ids: [],
    featured_image_id: null,
  });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [mediaItems, setMediaItems] = useState([]); // For featured image selection
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [categoriesRes, tagsRes, mediaRes] = await Promise.all([
          API.categories.list(),
          API.tags.list(),
          API.media.list({ page_size: 100 }) // Fetch enough for selection
        ]);
        setCategories(categoriesRes.data.results);
        setTags(tagsRes.data.results);
        setMediaItems(mediaRes.data.results);
      } catch (error) {
        toast({
          title: 'Error loading dependencies.',
          description: error.response?.data?.detail || 'Failed to load categories, tags, or media.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    fetchDependencies();

    if (slug) {
      setIsEditing(true);
      setLoading(true);
      API.posts.retrieve(slug)
        .then(response => {
          const post = response.data;
          setFormData({
            title: post.title,
            content: post.content,
            status: post.status,
            category_ids: post.categories.map(cat => cat.id),
            tag_ids: post.tags.map(tag => tag.id),
            featured_image_id: post.featured_image?.id || null,
          });
        })
        .catch(error => {
          toast({
            title: 'Error loading post.',
            description: error.response?.data?.detail || 'An unexpected error occurred.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          navigate('/admin/posts'); // Redirect if post not found
        })
        .finally(() => setLoading(false));
    }
  }, [slug, navigate, toast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const currentValues = formData[name];
      setFormData({
        ...formData,
        [name]: checked ? [...currentValues, parseInt(value)] : currentValues.filter(id => id !== parseInt(value)),
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRichTextChange = (value) => {
    setFormData({ ...formData, content: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await API.posts.update(slug, formData);
        toast({
          title: 'Post updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await API.posts.create(formData);
        toast({
          title: 'Post created.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      navigate('/admin/posts');
    } catch (error) {
      console.error('Form submission error:', error.response?.data || error.message);
      toast({
        title: `Error ${isEditing ? 'updating' : 'creating'} post.`,
        description: error.response?.data?.detail || JSON.stringify(error.response?.data?.errors) || 'Please check your input.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <Center h="calc(100vh - 100px)">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box p={4}>
      <Heading as="h1" size="xl" mb={6}>
        {isEditing ? `Edit Post: ${formData.title}` : 'Create New Post'}
      </Heading>

      <form onSubmit={handleSubmit}>
        <FormControl id="title" mb={4} isRequired>
          <FormLabel>Title</FormLabel>
          <Input name="title" value={formData.title} onChange={handleChange} placeholder="Post Title" />
        </FormControl>

        <FormControl id="content" mb={4}>
          <FormLabel>Content</FormLabel>
          <RichTextEditor
            value={formData.content}
            onChange={handleRichTextChange}
            placeholder="Write your content here..."
          />
        </FormControl>

        <FormControl id="status" mb={4}>
          <FormLabel>Status</FormLabel>
          <Select name="status" value={formData.status} onChange={handleChange}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </FormControl>

        <FormControl id="categories" mb={4}>
          <FormLabel>Categories</FormLabel>
          <CheckboxGroup
            name="category_ids"
            value={formData.category_ids}
            onChange={(values) => setFormData({ ...formData, category_ids: values })}
          >
            <Stack spacing={2} direction="row" wrap="wrap">
              {categories.map(cat => (
                <Checkbox key={cat.id} value={cat.id}>
                  {cat.name}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </FormControl>

        <FormControl id="tags" mb={4}>
          <FormLabel>Tags</FormLabel>
          <CheckboxGroup
            name="tag_ids"
            value={formData.tag_ids}
            onChange={(values) => setFormData({ ...formData, tag_ids: values })}
          >
            <Stack spacing={2} direction="row" wrap="wrap">
              {tags.map(tag => (
                <Checkbox key={tag.id} value={tag.id}>
                  {tag.name}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </FormControl>

        <FormControl id="featured_image" mb={6}>
          <FormLabel>Featured Image</FormLabel>
          <Select
            name="featured_image_id"
            value={formData.featured_image_id || ''}
            onChange={handleChange}
          >
            <option value="">-- No Featured Image --</option>
            {mediaItems.map(media => (
              <option key={media.id} value={media.id}>
                {media.title || media.file_url?.split('/').pop()}
              </option>
            ))}
          </Select>
        </FormControl>

        <Button type="submit" colorScheme="purple" isLoading={loading} mr={4}>
          {isEditing ? 'Update Post' : 'Create Post'}
        </Button>
        <Button onClick={() => navigate('/admin/posts')} variant="ghost">
          Cancel
        </Button>
      </form>
    </Box>
  );
};

export default PostFormPage;
```

#### `frontend/src/App.js`

```javascript