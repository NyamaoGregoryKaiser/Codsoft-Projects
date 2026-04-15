```python
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Resource, Namespace, fields
from marshmallow import ValidationError
from app.schemas.comment import CommentSchema, CommentUpdateSchema
from app.comments.services import CommentService
from app.models.comment import Comment
from app.utils.decorators import owner_or_admin_required, editor_or_admin_required
from app.extensions import api, cache, limiter
from app.errors import APIError

# Note: comments for a specific post are typically nested under /posts/<post_id>/comments
# We will create a separate namespace for direct comment management if needed.
# For now, let's just make direct comment routes.

comments_ns = Namespace('comments', description='Comment operations')

comment_schema = CommentSchema()
comment_update_schema = CommentUpdateSchema()
comments_list_schema = CommentSchema(many=True)

# Flask-RESTX model definitions for Swagger documentation
comment_model = comments_ns.model('Comment', {
    'id': fields.Integer(readOnly=True, description='The unique identifier of a comment'),
    'content': fields.String(required=True, description='The comment content'),
    'author_id': fields.Integer(required=True, description='The ID of the comment author'),
    'post_id': fields.Integer(required=True, description='The ID of the post the comment belongs to'),
    'author': fields.Nested(api.model('CommentAuthorInfo', {
        'id': fields.Integer(),
        'username': fields.String(),
        'role': fields.String()
    }), readOnly=True, description='Author details'),
    'created_at': fields.DateTime(readOnly=True, description='Timestamp of creation'),
    'updated_at': fields.DateTime(readOnly=True, description='Timestamp of last update')
})

comment_create_model = comments_ns.model('CommentCreate', {
    'content': fields.String(required=True, description='The comment content'),
    'post_id': fields.Integer(required=True, description='The ID of the post to comment on')
    # author_id is automatically set by the backend
})

comment_update_model = comments_ns.model('CommentUpdate', {
    'content': fields.String(description='New comment content')
})


@comments_ns.route('/post/<int:post_id>')
@comments_ns.param('post_id', 'The post identifier')
class PostCommentsList(Resource):
    @comments_ns.response(200, 'Success', comments_list_schema)
    @comments_ns.response(404, 'Post not found')
    @limiter.limit("60 per minute")
    @cache.cached(timeout=60, key_prefix="comments_for_post_")
    def get(self, post_id):
        """Retrieve all comments for a specific post."""
        from app.models.post import Post # Import here to avoid circular dependency
        post = Post.query.get(post_id)
        if not post:
            raise APIError(message="Post not found", code=404)
        
        comments = CommentService.get_comments_for_post(post_id)
        return comments_list_schema.dump(comments, include_author=True), 200

    @jwt_required()
    @comments_ns.expect(comment_create_model, validate=True)
    @comments_ns.response(201, 'Comment created successfully', comment_model)
    @comments_ns.response(400, 'Validation Error')
    @comments_ns.response(401, 'Unauthorized')
    @comments_ns.response(404, 'Post not found')
    @limiter.limit("10 per minute")
    @cache.clear() # Clear cache for comments of this post
    def post(self, post_id):
        """Create a new comment on a post."""
        from app.models.post import Post # Import here to avoid circular dependency
        post = Post.query.get(post_id)
        if not post:
            raise APIError(message="Post not found", code=404)

        current_user_id = get_jwt_identity()
        try:
            comment_data = comment_schema.load(request.json, partial=True)
        except ValidationError as err:
            raise APIError(message="Validation failed", code=400, payload={'errors': err.messages})
        
        # Ensure post_id from URL matches payload if provided, or set from URL
        if 'post_id' in comment_data and comment_data['post_id'] != post_id:
            raise APIError(message="Mismatched post_id in URL and payload.", code=400)
        
        new_comment = CommentService.create_comment(
            comment_data['content'],
            current_user_id,
            post_id # Always use post_id from URL
        )
        return comment_schema.dump(new_comment, include_author=True), 201

@comments_ns.route('/<int:id>')
@comments_ns.param('id', 'The comment identifier')
class CommentResource(Resource):
    @comments_ns.response(200, 'Success', comment_model)
    @comments_ns.response(404, 'Comment not found')
    @limiter.limit("60 per minute")
    @cache.cached(timeout=60, key_prefix="comment_")
    def get(self, id):
        """Retrieve a specific comment by ID."""
        comment = CommentService.get_comment_by_id(id)
        if not comment:
            raise APIError(message="Comment not found", code=404)
        return comment_schema.dump(comment, include_author=True), 200

    @jwt_required()
    @owner_or_admin_required(Comment)
    @comments_ns.expect(comment_update_model, validate=True, partial=True)
    @comments_ns.response(200, 'Comment updated successfully', comment_model)
    @comments_ns.response(400, 'Validation Error')
    @comments_ns.response(401, 'Unauthorized')
    @comments_ns.response(403, 'Forbidden (Not owner or admin)')
    @comments_ns.response(404, 'Comment not found')
    @limiter.limit("10 per minute")
    @cache.clear() # Clear cache related to this comment and its post
    def put(self, id):
        """Update an existing comment (Owner or Admin only)."""
        comment = CommentService.get_comment_by_id(id)
        if not comment:
            raise APIError(message="Comment not found", code=404)

        try:
            update_data = comment_update_schema.load(request.json, partial=True)
        except ValidationError as err:
            raise APIError(message="Validation failed", code=400, payload={'errors': err.messages})
        
        updated_comment = CommentService.update_comment(comment, update_data)
        return comment_schema.dump(updated_comment, include_author=True), 200

    @jwt_required()
    @owner_or_admin_required(Comment)
    @comments_ns.response(204, 'Comment deleted successfully')
    @comments_ns.response(401, 'Unauthorized')
    @comments_ns.response(403, 'Forbidden (Not owner or admin)')
    @comments_ns.response(404, 'Comment not found')
    @limiter.limit("5 per minute")
    @cache.clear() # Clear cache related to this comment and its post
    def delete(self, id):
        """Delete a comment (Owner or Admin only)."""
        comment = CommentService.get_comment_by_id(id)
        if not comment:
            raise APIError(message="Comment not found", code=404)
        
        CommentService.delete_comment(comment)
        return '', 204
```