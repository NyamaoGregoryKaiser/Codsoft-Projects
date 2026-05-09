```python
from locust import HttpUser, task, between
import json

class SecureAuthUser(HttpUser):
    wait_time = between(1, 2) # Users wait 1 to 2 seconds between tasks
    host = "http://localhost:80" # Point to Nginx or backend directly

    # Store tokens across tasks for a single user session
    access_token = None
    refresh_token_cookie = None
    user_email = "testuser@example.com" # Use a dedicated test user for load testing
    user_password = "testpassword"

    def on_start(self):
        """On start of user, register and login (if not already logged in)."""
        # Attempt to register first, if fails due to conflict, it's fine.
        register_payload = {
            "email": self.user_email,
            "password": self.user_password,
            "first_name": "Load",
            "last_name": "Test"
        }
        self.client.post("/api/v1/auth/register", json=register_payload, catch_response=True)
        
        # Always try to login
        response = self.client.post(
            "/api/v1/auth/login",
            data={"username": self.user_email, "password": self.user_password},
            name="/api/v1/auth/login [Login]",
            catch_response=True
        )
        if response.status_code == 200:
            self.access_token = response.json()["access_token"]
            self.refresh_token_cookie = response.cookies.get("refresh_token")
            self.client.headers = {"Authorization": f"Bearer {self.access_token}"}
            # Manually set refresh token for subsequent requests if needed, though axios does it for real frontend
            if self.refresh_token_cookie:
                self.client.cookies.set("refresh_token", self.refresh_token_cookie)
            response.success()
        else:
            response.failure(f"Failed to login: {response.text}")
            self.environment.runner.quit() # Stop user if login fails

    @task(3)
    def get_user_profile(self):
        """Authenticated task: Get current user profile."""
        with self.client.get("/api/v1/users/me", name="/api/v1/users/me [Profile]", catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get profile: {response.text}")

    @task(5)
    def get_all_posts(self):
        """Authenticated task: Get all posts."""
        with self.client.get("/api/v1/posts/", name="/api/v1/posts/ [Get All]", catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get posts: {response.text}")
            
            # Optional: Store post IDs to view a specific post later
            if response.status_code == 200 and response.json():
                self.post_ids = [p["id"] for p in response.json()]
            else:
                self.post_ids = []

    @task(1)
    def create_and_delete_post(self):
        """Authenticated task: Create a new post, then delete it."""
        post_data = {
            "title": f"Test Post by {self.user_email} {self.environment.runner.stats.total.requests}",
            "content": "This is a test post content created during load testing."
        }
        with self.client.post("/api/v1/posts/", json=post_data, name="/api/v1/posts/ [Create]", catch_response=True) as create_response:
            if create_response.status_code == 201:
                post_id = create_response.json()["id"]
                create_response.success()
                
                # Immediately delete the post
                with self.client.delete(f"/api/v1/posts/{post_id}", name="/api/v1/posts/{id} [Delete]", catch_response=True) as delete_response:
                    if delete_response.status_code != 204:
                        delete_response.failure(f"Failed to delete post {post_id}: {delete_response.text}")
                    else:
                        delete_response.success()
            else:
                create_response.failure(f"Failed to create post: {create_response.text}")

    @task(1)
    def refresh_token(self):
        """Task to refresh access token."""
        with self.client.post(
            "/api/v1/auth/refresh-token",
            name="/api/v1/auth/refresh-token [Refresh Token]",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self.access_token = response.json()["access_token"]
                self.refresh_token_cookie = response.cookies.get("refresh_token")
                self.client.headers["Authorization"] = f"Bearer {self.access_token}"
                if self.refresh_token_cookie:
                    self.client.cookies.set("refresh_token", self.refresh_token_cookie)
                response.success()
            else:
                response.failure(f"Failed to refresh token: {response.text}")
                # If refresh fails, consider it a critical error for the user session
                self.environment.runner.quit()

    def on_stop(self):
        """Logout user on stop."""
        if self.access_token:
            self.client.post("/api/v1/auth/logout", name="/api/v1/auth/logout [Logout]", catch_response=True)

```