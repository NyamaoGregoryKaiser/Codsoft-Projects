```python
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Resource, Namespace, fields
from marshmallow import ValidationError
from app.schemas.post import PostSchema, PostUpdateSchema
from app.posts.services import PostService
from app.models.post import Post
from app.utils.decorators import owner_or_admin_required, editor_or_admin_required
from app.extensions import api, cache, limiter
from app.errors import APIError

posts_ns = Namespace('posts', description='Blog post operations')

post_schema = PostSchema()
post_update_schema = PostUpdateSchema()
posts_list_schema = PostSchema(many=True)

# Flask-RESTX model definitions for Swagger documentation
post_model = posts_ns.model('Post', {
    'id': fields.Integer(readOnly=True, description='The unique identifier of a post'),
    'title': fields.String(required=True, description='The post title'),
    'content': fields.String(required=True, description='The post content'),
    'author_id': fields.Integer(required=True, description='The ID of the post author'),
    'author': fields.Nested(api.model('AuthorInfo', {
        'id': fields.Integer(),
        'username': fields.String(),
        'role': fields.String()
    }), readOnly=True, description='Author details'),
    'created_at': fields.DateTime(readOnly=True, description='Timestamp of creation'),
    'updated_at': fields.DateTime(readOnly=True, description='Timestamp of last update'),
    'comments': fields.List(fields.Nested(api.model('CommentInfo', {
        'id': fields.Integer(),
        'content': fields.String(),
        'author_id': fields.Integer(),
        'created_at': fields.DateTime()
    })), readOnly=True, description='List of comments on the post')
})

post_create_model = posts_ns.model('PostCreate', {
    'title': fields.String(required=True, description='The post title'),
    'content': fields.String(required=True, description='The post content')
    # author_id is automatically set by the backend
})

post_update_model = posts_ns.model('PostUpdate', {
    'title': fields.String(description='New post title'),
    'content': fields.String(description='New post content'),
    'author_id': fields.Integer(description='New author ID (Admin only)')
})


@posts_ns.route('/')
class PostList(Resource):
    @posts_ns.response(200, 'Success', posts_list_schema)
    @posts_ns.response(401, 'Unauthorized')
    @limiter.limit("60 per minute")
    @cache.cached(timeout=120, key_prefix='all_posts')
    def get(self):
        """Retrieve all blog posts."""
        posts = PostService.get_all_posts()
        return posts_list_schema.dump(posts, include_author=True), 200

    @jwt_required()
    @editor_or_admin_required
    @posts_ns.expect(post_create_model, validate=True)
    @posts_ns.response(201, 'Post created successfully', post_model)
    @posts_ns.response(400, 'Validation Error')
    @posts_ns.response(401, 'Unauthorized')
    @posts_ns.response(403, 'Forbidden (Editor/Admin access required)')
    @limiter.limit("10 per minute")
    @cache.clear() # Clear post list cache
    def post(self):
        """Create a new blog post (Editor or Admin only)."""
        current_user_id = get_jwt_identity()
        try:
            post_data = post_schema.load(request.json, partial=True) # author_id will be filled by service
        except ValidationError as err:
            raise APIError(message="Validation failed", code=400, payload={'errors': err.messages})

        new_post = PostService.create_post(
            post_data['title'],
            post_data['content'],
            current_user_id
        )
        return post_schema.dump(new_post, include_author=True), 201

@posts_ns.route('/<int:id>')
@posts_ns.param('id', 'The post identifier')
class PostResource(Resource):
    @posts_ns.response(200, 'Success', post_model)
    @posts_ns.response(404, 'Post not found')
    @limiter.limit("60 per minute")
    @cache.cached(timeout=300, key_prefix="post_")
    def get(self, id):
        """Retrieve a specific post by ID."""
        post = PostService.get_post_by_id(id)
        if not post:
            raise APIError(message="Post not found", code=404)
        return post_schema.dump(post, include_author=True, include_comments=True), 200

    @jwt_required()
    @owner_or_admin_required(Post)
    @posts_ns.expect(post_update_model, validate=True, partial=True)
    @posts_ns.response(200, 'Post updated successfully', post_model)
    @posts_ns.response(400, 'Validation Error')
    @posts_ns.response(401, 'Unauthorized')
    @posts_ns.response(403, 'Forbidden (Not owner or admin)')
    @posts_ns.response(404, 'Post not found')
    @limiter.limit("10 per minute")
    @cache.clear() # Clear cache related to this post
    def put(self, id):
        """Update an existing post (Owner or Admin only)."""
        current_user_id = get_jwt_identity()
        post = PostService.get_post_by_id(id)
        if not post:
            raise APIError(message="Post not found", code=404)

        try:
            update_data = post_update_schema.load(request.json, partial=True)
        except ValidationError as err:
            raise APIError(message="Validation failed", code=400, payload={'errors': err.messages})
        
        # Only admin can change author_id
        from app.models.user import User # Import here to avoid circular dependency
        current_user = User.query.get(current_user_id)
        if 'author_id' in update_data and current_user.role != 'admin':
            raise APIError(message="Forbidden: Only administrators can change post author.", code=403)
        
        updated_post = PostService.update_post(post, update_data)
        return post_schema.dump(updated_post, include_author=True), 200

    @jwt_required()
    @owner_or_admin_required(Post)
    @posts_ns.response(204, 'Post deleted successfully')
    @posts_ns.response(401, 'Unauthorized')
    @posts_ns.response(403, 'Forbidden (Not owner or admin)')
    @posts_ns.response(404, 'Post not found')
    @limiter.limit("5 per minute")
    @cache.clear() # Clear cache related to this post
    def delete(self, id):
        """Delete a post (Owner or Admin only)."""
        post = PostService.get_post_by_id(id)
        if not post:
            raise APIError(message="Post not found", code=404)
        
        PostService.delete_post(post)
        return '', 204
```