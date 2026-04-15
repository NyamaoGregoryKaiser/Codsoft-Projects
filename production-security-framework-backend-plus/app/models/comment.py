```python
from datetime import datetime
from app.extensions import db

class Comment(db.Model):
    __tablename__ = 'comments'

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<Comment {self.id} for Post {self.post_id}>'

    def to_dict(self, include_author=False):
        data = {
            'id': self.id,
            'content': self.content,
            'author_id': self.author_id,
            'post_id': self.post_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        if include_author and self.author:
            data['author'] = self.author.to_dict()
        return data
```