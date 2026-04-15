```python
from flask import render_template, request, redirect, url_for, flash, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from app.frontend import frontend_blueprint
from app.auth.services import AuthService
from app.models.user import User # Import User model to display user info

# This is a minimalist frontend for demonstration purposes.
# In a real-world scenario, a separate SPA (React/Vue/Angular) would consume the API.

@frontend_blueprint.route('/')
def home():
    """Home page displaying posts or login/register options."""
    # This page could fetch posts via a client-side script or server-side.
    # For simplicity, just shows links for now.
    return render_template('posts.html', posts=[]) # Will be populated via JS or backend call

@frontend_blueprint.route('/login', methods=['GET', 'POST'])
def login():
    """User login page."""
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        tokens, error = AuthService.login_user(email, password)
        if error:
            flash(error, 'danger')
            return render_template('login.html', email=email), 401
        
        # Normally, tokens would be sent to the client (e.g., SPA) and stored
        # in localStorage/sessionStorage. For this Jinja2 example, we could set
        # them in a cookie for demonstration, but it's not ideal for API tokens.
        # Here, we'll just flash success and redirect.
        flash('Logged in successfully! Access token would be handled client-side.', 'success')
        return redirect(url_for('frontend.home'))

    return render_template('login.html')

@frontend_blueprint.route('/register', methods=['GET', 'POST'])
def register():
    """User registration page."""
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')

        user, error = AuthService.register_user(username, email, password)
        if error:
            flash(error, 'danger')
            return render_template('register.html', username=username, email=email), 409
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('frontend.login'))
    
    return render_template('register.html')

@frontend_blueprint.route('/logout', methods=['POST'])
@jwt_required(optional=True) # Optional so logged-out users don't error
def logout():
    """User logout endpoint."""
    if get_jwt_identity(): # Check if user is actually logged in
        jti = get_jwt()['jti']
        AuthService.revoke_token(jti)
        flash('You have been logged out.', 'info')
    else:
        flash('You were not logged in.', 'info')
    return redirect(url_for('frontend.home'))

@frontend_blueprint.route('/profile')
@jwt_required()
def profile():
    """User profile page (requires JWT)."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        flash('User not found.', 'danger')
        return redirect(url_for('frontend.login'))
    
    return render_template('profile.html', user=user)

@frontend_blueprint.route('/admin')
@jwt_required()
def admin_dashboard():
    """Admin dashboard (requires ADMIN role)."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or user.role.value != 'admin':
        flash('Access denied: Admin privileges required.', 'danger')
        return redirect(url_for('frontend.home'))
    
    # This is a very basic example; a real admin dashboard would have more logic
    return render_template('admin_dashboard.html', user=user)

```