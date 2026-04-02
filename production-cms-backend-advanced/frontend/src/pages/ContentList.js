import React, { useEffect, useState } from 'react';
import { getContentList, getCategories, getTags } from '../api/content';
import ContentCard from '../components/ContentCard';

const ContentList = () => {
    const [contentList, setContentList] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [categoriesData, tagsData] = await Promise.all([
                    getCategories(),
                    getTags(),
                ]);
                setCategories(categoriesData);
                setTags(tagsData);
            } catch (err) {
                console.error("Error fetching categories or tags:", err);
                setError('Failed to load filters.');
            }
        };
        fetchAllData();
    }, []);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            setError('');
            try {
                const params = {};
                if (selectedCategory) params.category = selectedCategory;
                if (selectedTag) params.tags = selectedTag; // Assuming API filters by tag ID
                if (searchQuery) params.search = searchQuery;

                const data = await getContentList(params);
                setContentList(data.results);
            } catch (err) {
                console.error("Error fetching content:", err);
                setError('Failed to load content.');
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [selectedCategory, selectedTag, searchQuery]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    return (
        <div style={containerStyle}>
            <h1 style={titleStyle}>Latest Content</h1>

            <div style={filtersContainerStyle}>
                <input
                    type="text"
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={searchInputStyle}
                />
                <select onChange={(e) => setSelectedCategory(e.target.value)} value={selectedCategory} style={selectStyle}>
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <select onChange={(e) => setSelectedTag(e.target.value)} value={selectedTag} style={selectStyle}>
                    <option value="">All Tags</option>
                    {tags.map(tag => (
                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                </select>
            </div>

            {loading && <p style={loadingStyle}>Loading content...</p>}
            {error && <p style={errorStyle}>{error}</p>}
            {!loading && contentList.length === 0 && <p style={noContentStyle}>No content found matching your criteria.</p>}
            <div style={contentGridStyle}>
                {contentList.map(content => (
                    <ContentCard key={content.id} content={content} />
                ))}
            </div>
        </div>
    );
};

const containerStyle = {
    maxWidth: '1200px',
    margin: '30px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
};

const titleStyle = {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333',
};

const filtersContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '30px',
    flexWrap: 'wrap',
};

const searchInputStyle = {
    padding: '10px 15px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '1em',
    width: '300px',
};

const selectStyle = {
    padding: '10px 15px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '1em',
    minWidth: '180px',
    backgroundColor: 'white',
    cursor: 'pointer',
};

const loadingStyle = {
    textAlign: 'center',
    fontSize: '1.2em',
    color: '#666',
};

const errorStyle = {
    textAlign: 'center',
    fontSize: '1.2em',
    color: 'red',
};

const noContentStyle = {
    textAlign: 'center',
    fontSize: '1.1em',
    color: '#888',
    marginTop: '50px',
};

const contentGridStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
};

export default ContentList;