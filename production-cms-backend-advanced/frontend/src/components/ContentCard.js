import React from 'react';
import { Link } from 'react-router-dom';

const ContentCard = ({ content }) => {
    return (
        <div style={cardStyle}>
            <Link to={`/content/${content.slug}`} style={titleLinkStyle}>
                <h3 style={titleStyle}>{content.title}</h3>
            </Link>
            {content.featured_image && (
                <img src={content.featured_image.file_url} alt={content.featured_image.alt_text} style={imageStyle} />
            )}
            <p>{content.short_description || content.content.substring(0, 150) + '...'}</p>
            <div style={metaStyle}>
                <span>By: {content.author?.username || 'Unknown'}</span>
                <span>Category: {content.category?.name || 'N/A'}</span>
                <span>Published: {new Date(content.published_at).toLocaleDateString()}</span>
            </div>
            <div style={tagsStyle}>
                {content.tags?.map(tag => (
                    <span key={tag.id} style={tagStyle}>{tag.name}</span>
                ))}
            </div>
        </div>
    );
};

const cardStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    margin: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    width: 'calc(33% - 30px)', // For a 3-column layout
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
};

const titleStyle = {
    margin: '0 0 10px 0',
    color: '#333',
};

const titleLinkStyle = {
    textDecoration: 'none',
    color: 'inherit',
};

const imageStyle = {
    maxWidth: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '4px',
    marginBottom: '15px',
};

const metaStyle = {
    fontSize: '0.9em',
    color: '#666',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
};

const tagsStyle = {
    marginTop: '10px',
};

const tagStyle = {
    display: 'inline-block',
    backgroundColor: '#e0e0e0',
    borderRadius: '3px',
    padding: '5px 8px',
    marginRight: '5px',
    fontSize: '0.8em',
    color: '#555',
};

export default ContentCard;