```javascript
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import PostCard from '../../src/components/PostCard';

// Mock process.env for REACT_APP_API_BASE_URL
const mockApiBaseUrl = 'http://localhost:5000';
process.env.REACT_APP_API_BASE_URL = mockApiBaseUrl;

describe('PostCard', () => {
  const mockPost = {
    id: 'post-1',
    title: 'Test Post Title',
    slug: 'test-post-title',
    excerpt: 'This is a short excerpt for the test post.',
    featuredImage: '/uploads/image.jpg',
    author: {
      username: 'testauthor',
    },
    category: {
      name: 'Test Category',
    },
    tags: [
      { id: 'tag-1', name: 'Tag1' },
      { id: 'tag-2', name: 'Tag2' },
    ],
  };

  it('renders post title, excerpt, author, category, and tags', () => {
    render(
      <Router>
        <PostCard post={mockPost} />
      </Router>
    );

    expect(screen.getByRole('heading', { name: mockPost.title })).toBeInTheDocument();
    expect(screen.getByText(mockPost.excerpt)).toBeInTheDocument();
    expect(screen.getByText(`By ${mockPost.author.username}`)).toBeInTheDocument();
    expect(screen.getByText(`In ${mockPost.category.name}`)).toBeInTheDocument();
    expect(screen.getByText('Tag1')).toBeInTheDocument();
    expect(screen.getByText('Tag2')).toBeInTheDocument();
  });

  it('renders the featured image if available', () => {
    render(
      <Router>
        <PostCard post={mockPost} />
      </Router>
    );

    const image = screen.getByAltText(mockPost.title);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', `${mockApiBaseUrl}${mockPost.featuredImage}`);
  });

  it('renders a placeholder image if featuredImage is null', () => {
    const postWithoutImage = { ...mockPost, featuredImage: null };
    render(
      <Router>
        <PostCard post={postWithoutImage} />
      </Router>
    );

    const image = screen.getByAltText(postWithoutImage.title);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://via.placeholder.com/400x200?text=No+Image');
  });

  it('links to the correct post detail page', () => {
    render(
      <Router>
        <PostCard post={mockPost} />
      </Router>
    );

    const titleLink = screen.getByRole('link', { name: mockPost.title });
    expect(titleLink).toHaveAttribute('href', `/posts/${mockPost.slug}`);
  });

  it('renders "Uncategorized" if category is null', () => {
    const postWithoutCategory = { ...mockPost, category: null };
    render(
      <Router>
        <PostCard post={postWithoutCategory} />
      </Router>
    );

    expect(screen.getByText('In Uncategorized')).toBeInTheDocument();
  });

  it('does not render tags section if tags array is empty', () => {
    const postWithoutTags = { ...mockPost, tags: [] };
    render(
      <Router>
        <PostCard post={postWithoutTags} />
      </Router>
    );
    expect(screen.queryByText('Tag1')).not.toBeInTheDocument();
    expect(screen.queryByText('Tag2')).not.toBeInTheDocument();
  });
});
```