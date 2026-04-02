import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getContentDetail, getComments, postComment } from '../api/content';
import DOMPurify from 'dompurify'; // For sanitizing HTML content

const ContentDetail = () => {
    const { slug } = useParams();
    const [content, setContent] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [commentBody, setCommentBody] = useState('');
    const [commentAuthorName, setCommentAuthorName] = useState('');
    const [commentAuthorEmail, setCommentAuthorEmail] = useState('');
    const [commentError, setCommentError] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    useEffect(() => {
        const fetchContentAndComments = async () => {
            try {
                const contentData = await getContentDetail(slug);
                setContent(contentData);
                // Comments are nested in content data, but can also fetch separately if needed
                if (contentData.first_level_comments) {
                    setComments(contentData.first_level_comments);
                } else {
                    const commentsData = await getComments(slug); // Fallback or if API separates
                    setComments(commentsData);
                }
            } catch (err) {
                console.error("Error fetching content or comments:", err);
                setError('Failed to load content or comments.');
            } finally {
                setLoading(false);
            }
        };

        fetchContentAndComments();
    }, [slug]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        setCommentLoading(true);
        setCommentError('');

        try {
            const newCommentData = {
                body: commentBody,
                author_name: commentAuthorName || undefined, // Send if not empty
                author_email: commentAuthorEmail || undefined, // Send if not empty
            };
            const newComment = await postComment(slug, newCommentData);
            setComments(prevComments => [...prevComments, newComment]);
            setCommentBody('');
            setCommentAuthorName('');
            setCommentAuthorEmail('');
            alert(newComment.approved ? 'Comment posted successfully!' : 'Comment submitted for approval!');
        } catch (err) {
            console.error("Error posting comment:", err);
            setCommentError(err.response?.data?.message || 'Failed to post comment.');
        } finally {
            setCommentLoading(false);
        }
    };

    if (loading) return <div style={loadingStyle}>Loading content...</div>;
    if (error) return <div style={errorStyle}>{error}</div>;
    if (!content) return <div style={containerStyle}>Content not found.</div>;

    // Sanitize HTML content before rendering
    const sanitizedContent = DOMPurify.sanitize(content.content, { USE_PROFILES: { html: true } });

    return (
        <div style={containerStyle}>
            <h1 style={titleStyle}>{content.title}</h1>
            {content.featured_image && (
                <img src={content.featured_image.file_url} alt={content.featured_image.alt_text} style={imageStyle} />
            )}
            <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} style={contentBodyStyle} />
            <div style={metaStyle}>
                <span>By: {content.author?.username || 'Unknown'}</span>
                <span>Category: {content.category?.name || 'N/A'}</span>
                <span>Published: {new Date(content.published_at).toLocaleDateString()}</span>
                <span>Views: {content.views_count}</span>
            </div>

            <h2 style={commentsSectionTitleStyle}>Comments ({comments.length})</h2>
            <div style={commentsContainerStyle}>
                {comments.length > 0 ? (
                    comments.map(comment => (
                        <div key={comment.id} style={commentStyle}>
                            <p style={commentAuthorStyle}>
                                <strong>{comment.author_name || comment.commenter?.username || 'Anonymous'}</strong>
                                {' '} on {new Date(comment.created_at).toLocaleDateString()}
                                {!comment.approved && <span style={pendingApprovalStyle}> (Pending Approval)</span>}
                            </p>
                            <p>{comment.body}</p>
                            {comment.replies && comment.replies.length > 0 && (
                                <div style={repliesContainerStyle}>
                                    {comment.replies.map(reply => (
                                        <div key={reply.id} style={replyStyle}>
                                            <p style={commentAuthorStyle}>
                                                <strong>{reply.author_name || reply.commenter?.username || 'Anonymous'}</strong>
                                                {' '} on {new Date(reply.created_at).toLocaleDateString()}
                                                {!reply.approved && <span style={pendingApprovalStyle}> (Pending Approval)</span>}
                                            </p>
                                            <p>{reply.body}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p>No comments yet. Be the first to comment!</p>
                )}
            </div>

            <h3 style={commentsSectionTitleStyle}>Leave a Comment</h3>
            <form onSubmit={handleCommentSubmit} style={commentFormStyle}>
                {commentError && <p style={errorStyle}>{commentError}</p>}
                <div style={inputGroupStyle}>
                    <label htmlFor="commentBody" style={labelStyle}>Comment:</label>
                    <textarea
                        id="commentBody"
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        required
                        rows="5"
                        style={textareaStyle}
                    ></textarea>
                </div>
                <div style={inputGroupStyle}>
                    <label htmlFor="commentAuthorName" style={labelStyle}>Your Name (optional if logged in):</label>
                    <input
                        type="text"
                        id="commentAuthorName"
                        value={commentAuthorName}
                        onChange={(e) => setCommentAuthorName(e.target.value)}
                        style={inputStyle}
                    />
                </div>
                <div style={inputGroupStyle}>
                    <label htmlFor="commentAuthorEmail" style={labelStyle}>Your Email (optional if logged in):</label>
                    <input
                        type="email"
                        id="commentAuthorEmail"
                        value={commentAuthorEmail}
                        onChange={(e) => setCommentAuthorEmail(e.target.value)}
                        style={inputStyle}
                    />
                </div>
                <button type="submit" disabled={commentLoading} style={buttonStyle}>
                    {commentLoading ? 'Submitting...' : 'Post Comment'}
                </button>
            </form>
        </div>
    );
};

const containerStyle = {
    maxWidth: '900px',
    margin: '30px auto',
    padding: '20px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    borderRadius: '8px',
};

const loadingStyle = {
    textAlign: 'center',
    fontSize: '1.2em',
    padding: '50px',
};

const errorStyle = {
    color: 'red',
    textAlign: 'center',
    fontSize: '1.2em',
    padding: '50px',
};

const titleStyle = {
    fontSize: '2.5em',
    marginBottom: '15px',
    color: '#333',
};

const imageStyle = {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
    marginBottom: '20px',
};

const contentBodyStyle = {
    fontSize: '1.1em',
    lineHeight: '1.6',
    color: '#444',
    marginBottom: '20px',
};

const metaStyle = {
    fontSize: '0.9em',
    color: '#666',
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '15px',
    borderTop: '1px solid #eee',
};

const commentsSectionTitleStyle = {
    fontSize: '1.8em',
    marginBottom: '20px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
};

const commentsContainerStyle = {
    marginBottom: '30px',
};

const commentStyle = {
    backgroundColor: '#f9f9f9',
    border: '1px solid #eee',
    borderRadius: '5px',
    padding: '15px',
    marginBottom: '10px',
};

const commentAuthorStyle = {
    fontSize: '0.9em',
    color: '#555',
    marginBottom: '5px',
};

const pendingApprovalStyle = {
    color: 'orange',
    marginLeft: '10px',
    fontWeight: 'normal',
};

const repliesContainerStyle = {
    marginLeft: '20px',
    borderLeft: '2px solid #ddd',
    paddingLeft: '15px',
    marginTop: '10px',
};

const replyStyle = {
    backgroundColor: '#f0f0f0',
    border: '1px solid #e5e5e5',
    borderRadius: '5px',
    padding: '10px',
    marginBottom: '5px',
};

const commentFormStyle = {
    backgroundColor: '#fdfdfd',
    padding: '20px',
    border: '1px solid #eee',
    borderRadius: '8px',
};

const inputGroupStyle = {
    marginBottom: '15px',
};

const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontSize: '1em',
};

const textareaStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontSize: '1em',
    resize: 'vertical',
};

const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1em',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
};


export default ContentDetail;