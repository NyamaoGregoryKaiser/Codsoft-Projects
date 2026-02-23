```python
from werkzeug.security import generate_password_hash, check_password_hash
from backend.app.extensions import db, ma
from .base import Base, TimestampMixin

# Many-to-many relationship for User and Role
user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'), primary_key=True)
)

class Role(Base):
    __tablename__ = 'role'
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))

    def __repr__(self):
        return f'<Role {self.name}>'

class User(Base):
    __tablename__ = 'user'
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    data_sources = db.relationship('DataSource', backref='owner', lazy=True)
    visualizations = db.relationship('Visualization', backref='creator', lazy=True)
    dashboards = db.relationship('Dashboard', backref='author', lazy=True)
    roles = db.relationship('Role', secondary=user_roles, lazy='joined',
                            backref=db.backref('users', lazy=True))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def roles(self):
        return [role.name for role in self.roles]

    def __repr__(self):
        return f'<User {self.username}>'

class RoleSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Role
        load_instance = True
        sqla_session = db.session

class UserSchema(ma.SQLAlchemyAutoSchema):
    roles = ma.Method("get_role_names")

    class Meta:
        model = User
        load_instance = True
        sqla_session = db.session
        exclude = ('password_hash',) # Never expose password hash

    def get_role_names(self, obj):
        return [role.name for role in obj.roles]

user_schema = UserSchema()
users_schema = UserSchema(many=True)
role_schema = RoleSchema()
roles_schema = RoleSchema(many=True)

```