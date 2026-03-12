from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import use_args
from backend.app.extensions import db
from backend.app.models.post import Post, PostSchema
from backend.app.models.user import User
from backend.app.utils.decorators import role_required
from backend.app.utils.errors import APIError
from backend.app.extensions import cache

bp = Blueprint('posts', __name__)
post_schema = PostSchema()
posts_schema = PostSchema(many=True)

class PostService:
    @staticmethod
    @cache.cached(timeout=60, key_prefix='all_posts') # Cache all posts for 60 seconds
    def get_all_posts():
        posts = db.session.scalars(db.select(Post)).all()
        return posts_schema.dump(posts)

    @staticmethod
    def get_post_by_id(post_id):
        post = db.session.scalar(db.select(Post).filter_by(id=post_id))
        if not post:
            raise APIError("Post not found", status_code=404)
        return post_schema.dump(post)

    @staticmethod
    def create_post(data, user_id):
        errors = post_schema.validate(data)
        if errors:
            raise APIError("Validation Error", status_code=422, payload=errors)
        
        post = Post(title=data['title'], content=data['content'], user_id=user_id)
        db.session.add(post)
        db.session.commit()
        cache.delete_memoized(PostService.get_all_posts) # Invalidate cache
        return post_schema.dump(post)

    @staticmethod
    def update_post(post_id, data, current_user_id):
        post = db.session.scalar(db.select(Post).filter_by(id=post_id))
        if not post:
            raise APIError("Post not found", status_code=404)
        
        # Only author or Admin can update
        current_user = db.session.scalar(db.select(User).filter_by(id=current_user_id))
        if post.user_id != current_user_id and not current_user.has_role('Admin'):
            raise APIError("Unauthorized to update this post", status_code=403)
        
        errors = post_schema.validate(data, partial=True)
        if errors:
            raise APIError("Validation Error", status_code=422, payload=errors)
        
        for key, value in data.items():
            setattr(post, key, value)
        db.session.commit()
        cache.delete_memoized(PostService.get_all_posts) # Invalidate cache
        return post_schema.dump(post)

    @staticmethod
    def delete_post(post_id, current_user_id):
        post = db.session.scalar(db.select(Post).filter_by(id=post_id))
        if not post:
            raise APIError("Post not found", status_code=404)
        
        # Only author or Admin can delete
        current_user = db.session.scalar(db.select(User).filter_by(id=current_user_id))
        if post.user_id != current_user_id and not current_user.has_role('Admin'):
            raise APIError("Unauthorized to delete this post", status_code=403)
        
        db.session.delete(post)
        db.session.commit()
        cache.delete_memoized(PostService.get_all_posts) # Invalidate cache
        return {"message": "Post deleted successfully"}


@bp.route('/', methods=['GET'])
@jwt_required(optional=True) # Allow public access, but show author for logged-in users
@limiter.limit("20 per minute")
def get_posts():
    """
    Get All Posts
    ---
    get:
      summary: Retrieve a list of all posts
      security:
        - BearerAuth: [] # Optional security
      responses:
        200:
          description: A list of posts
          schema:
            type: array
            items:
              $ref: '#/definitions/PostSchema'
    """
    posts = PostService.get_all_posts()
    return jsonify(posts), 200

@bp.route('/<int:post_id>', methods=['GET'])
@jwt_required(optional=True)
def get_post(post_id):
    """
    Get Post by ID
    ---
    get:
      summary: Retrieve a single post by ID
      security:
        - BearerAuth: [] # Optional security
      parameters:
        - in: path
          name: post_id
          type: integer
          required: true
          description: The ID of the post to retrieve
      responses:
        200:
          description: Post details
          schema:
            $ref: '#/definitions/PostSchema'
        404:
          description: Post not found
    """
    post = PostService.get_post_by_id(post_id)
    return jsonify(post), 200

@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('User') # Only authenticated users (and admins implicitly) can create posts
@use_args(PostSchema(), location="json")
def create_post(args):
    """
    Create New Post
    ---
    post:
      summary: Create a new post
      security:
        - BearerAuth: []
      parameters:
        - in: body
          name: body
          schema:
            type: object
            required:
              - title
              - content
            properties:
              title:
                type: string
                example: My First Post
              content:
                type: string
                example: This is the content of my very first post.
      responses:
        201:
          description: Post created successfully
          schema:
            $ref: '#/definitions/PostSchema'
        401:
          description: Unauthorized
        403:
          description: Forbidden (insufficient permissions, e.g., guest user)
        422:
          description: Validation error
    """
    user_id = get_jwt_identity()
    new_post = PostService.create_post(args, user_id)
    return jsonify(new_post), 201

@bp.route('/<int:post_id>', methods=['PUT'])
@jwt_required()
@role_required('User') # Only author or admin can update
@use_args(PostSchema(), location="json", partial=True)
def update_post(args, post_id):
    """
    Update Post
    ---
    put:
      summary: Update an existing post
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: post_id
          type: integer
          required: true
          description: The ID of the post to update
        - in: body
          name: body
          schema:
            type: object
            properties:
              title:
                type: string
                example: My Updated Post Title
              content:
                type: string
                example: The content has been revised.
      responses:
        200:
          description: Post updated successfully
          schema:
            $ref: '#/definitions/PostSchema'
        401:
          description: Unauthorized
        403:
          description: Forbidden (not author or admin)
        404:
          description: Post not found
        422:
          description: Validation error
    """
    user_id = get_jwt_identity()
    updated_post = PostService.update_post(post_id, args, user_id)
    return jsonify(updated_post), 200

@bp.route('/<int:post_id>', methods=['DELETE'])
@jwt_required()
@role_required('User') # Only author or admin can delete
def delete_post(post_id):
    """
    Delete Post
    ---
    delete:
      summary: Delete a post
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: post_id
          type: integer
          required: true
          description: The ID of the post to delete
      responses:
        200:
          description: Post deleted successfully
          schema:
            type: object
            properties:
              message: {type: string}
        401:
          description: Unauthorized
        403:
          description: Forbidden (not author or admin)
        404:
          description: Post not found
    """
    user_id = get_jwt_identity()
    result = PostService.delete_post(post_id, user_id)
    return jsonify(result), 200
```