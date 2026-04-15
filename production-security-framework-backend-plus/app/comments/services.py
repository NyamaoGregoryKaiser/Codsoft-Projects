```python
from flask import current_app
from app.extensions import db
from app.models.comment import Comment

class CommentService:
    @staticmethod
    def get_comments_for_post(post_id):
        """Fetches all comments for a specific post."""
        current_app.logger.debug(f"Fetching comments for post ID: {post_id}.")
        return Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at.asc()).all()

    @staticmethod
    def get_comment_by_id(comment_id):
        """Fetches a comment by ID."""
        current_app.logger.debug(f"Fetching comment with ID: {comment_id}.")
        return db.session.get(Comment, comment_id)

    @staticmethod
    def create_comment(content, author_id, post_id):
        """Creates a new comment."""
        comment = Comment(content=content, author_id=author_id, post_id=post_id)
        db.session.add(comment)
        db.session.commit()
        current_app.logger.info(f"Comment (ID: {comment.id}) created by user ID: {author_id} on post ID: {post_id}.")
        return comment

    @staticmethod
    def update_comment(comment, data):
        """Updates an existing comment."""
        current_app.logger.info(f"Attempting to update comment ID: {comment.id} with data: {data}.")
        for key, value in data.items():
            setattr(comment, key, value)
        db.session.commit()
        current_app.logger.info(f"Comment ID: {comment.id} updated successfully.")
        return comment

    @staticmethod
    def delete_comment(comment):
        """Deletes a comment."""
        comment_id = comment.id
        db.session.delete(comment)
        db.session.commit()
        current_app.logger.info(f"Comment ID: {comment_id} deleted successfully.")
        return True
```