```python
from flask import current_app
from app.extensions import db
from app.models.post import Post

class PostService:
    @staticmethod
    def get_all_posts():
        """Fetches all posts."""
        current_app.logger.debug("Fetching all posts.")
        return Post.query.order_by(Post.created_at.desc()).all()

    @staticmethod
    def get_post_by_id(post_id):
        """Fetches a post by ID."""
        current_app.logger.debug(f"Fetching post with ID: {post_id}.")
        return db.session.get(Post, post_id)

    @staticmethod
    def create_post(title, content, author_id):
        """Creates a new post."""
        post = Post(title=title, content=content, author_id=author_id)
        db.session.add(post)
        db.session.commit()
        current_app.logger.info(f"Post '{title}' (ID: {post.id}) created by user ID: {author_id}.")
        return post

    @staticmethod
    def update_post(post, data):
        """Updates an existing post."""
        current_app.logger.info(f"Attempting to update post ID: {post.id} with data: {data}.")
        for key, value in data.items():
            setattr(post, key, value)
        db.session.commit()
        current_app.logger.info(f"Post ID: {post.id} updated successfully.")
        return post

    @staticmethod
    def delete_post(post):
        """Deletes a post."""
        post_id = post.id
        db.session.delete(post)
        db.session.commit()
        current_app.logger.info(f"Post ID: {post_id} deleted successfully.")
        return True
```