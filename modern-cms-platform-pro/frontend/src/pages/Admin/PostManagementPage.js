import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Text, Button, Table, Thead, Tbody, Tr, Th, Td,
  Flex, Input, InputGroup, InputLeftElement, useToast, Spinner, Center,
  IconButton, Popover, PopoverTrigger, PopoverContent, PopoverArrow,
  PopoverCloseButton, PopoverHeader, PopoverBody, ButtonGroup
} from '@chakra-ui/react';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';

const PostManagementPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();
  const navigate = useNavigate();
  const { isStaff, isAdmin } = useAuth();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await API.posts.list({ search: searchTerm });
      setPosts(response.data.results);
    } catch (error) {
      toast({
        title: 'Error fetching posts.',
        description: error.response?.data?.detail || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [searchTerm]); // Refetch when search term changes

  const handleCreate = () => {
    navigate('/admin/posts/new');
  };

  const handleEdit = (slug) => {
    navigate(`/admin/posts/${slug}/edit`);
  };

  const handleDelete = async (slug) => {
    try {
      await API.posts.delete(slug);
      toast({
        title: 'Post archived.',
        description: 'The post has been moved to archived status.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchPosts(); // Refresh list
    } catch (error) {
      toast({
        title: 'Error archiving post.',
        description: error.response?.data?.detail || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handlePublish = async (slug) => {
    try {
      await API.posts.publish(slug);
      toast({
        title: 'Post published.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchPosts();
    } catch (error) {
      toast({
        title: 'Error publishing post.',
        description: error.response?.data?.detail || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDraft = async (slug) => {
    try {
      await API.posts.draft(slug);
      toast({
        title: 'Post moved to draft.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchPosts();
    } catch (error) {
      toast({
        title: 'Error moving post to draft.',
        description: error.response?.data?.detail || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Center h="calc(100vh - 100px)">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">Posts</Heading>
        {(isStaff || isAdmin) && (
          <Button leftIcon={<FaPlus />} colorScheme="purple" onClick={handleCreate}>
            Create New Post
          </Button>
        )}
      </Flex>

      <InputGroup mb={6}>
        <InputLeftElement pointerEvents="none">
          <FaSearch color="gray.300" />
        </InputLeftElement>
        <Input
          placeholder="Search posts by title or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      {posts.length === 0 ? (
        <Text textAlign="center" mt={10} fontSize="lg" color="gray.500">No posts found.</Text>
      ) : (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Author</Th>
              <Th>Status</Th>
              <Th>Published At</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {posts.map((post) => (
              <Tr key={post.id}>
                <Td fontWeight="semibold">{post.title}</Td>
                <Td>{post.author?.full_name || post.author?.email}</Td>
                <Td>
                  <Text
                    as="span"
                    px={2}
                    py={1}
                    borderRadius="md"
                    fontSize="sm"
                    bg={post.status === 'published' ? 'green.100' : post.status === 'draft' ? 'blue.100' : 'red.100'}
                    color={post.status === 'published' ? 'green.800' : post.status === 'draft' ? 'blue.800' : 'red.800'}
                  >
                    {post.status.toUpperCase()}
                  </Text>
                </Td>
                <Td>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'N/A'}</Td>
                <Td>
                  <Flex>
                    <IconButton
                      aria-label="Edit Post"
                      icon={<FaEdit />}
                      size="sm"
                      mr={2}
                      onClick={() => handleEdit(post.slug)}
                    />
                    {isStaff && (post.status !== 'published' ? (
                      <IconButton
                        aria-label="Publish Post"
                        icon={<FaCheckCircle />}
                        size="sm"
                        mr={2}
                        colorScheme="green"
                        onClick={() => handlePublish(post.slug)}
                      />
                    ) : (
                      <IconButton
                        aria-label="Move to Draft"
                        icon={<FaTimesCircle />}
                        size="sm"
                        mr={2}
                        colorScheme="blue"
                        onClick={() => handleDraft(post.slug)}
                      />
                    ))}
                    {(isStaff || isAdmin) && (
                      <Popover placement="top-end">
                        <PopoverTrigger>
                          <IconButton
                            aria-label="Delete Post"
                            icon={<FaTrash />}
                            size="sm"
                            colorScheme="red"
                          />
                        </PopoverTrigger>
                        <PopoverContent>
                          <PopoverArrow />
                          <PopoverCloseButton />
                          <PopoverHeader>Confirmation!</PopoverHeader>
                          <PopoverBody>
                            Are you sure you want to archive this post?
                            <ButtonGroup display="flex" justifyContent="flex-end" mt={4}>
                              <Button variant="ghost">Cancel</Button>
                              <Button colorScheme="red" onClick={() => handleDelete(post.slug)}>Archive</Button>
                            </ButtonGroup>
                          </PopoverBody>
                        </PopoverContent>
                      </Popover>
                    )}
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default PostManagementPage;
```

#### `frontend/src/pages/Admin/PostFormPage.js` (Simplified form example)

```javascript