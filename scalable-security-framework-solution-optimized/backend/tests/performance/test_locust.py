```python
from locust import HttpUser, task, between
import json

class SecureSphereUser(HttpUser):
    wait_time = between(1, 2)
    host = "http://localhost:8000"  # Or your backend URL

    # Store tokens per user session
    access_token = None
    refresh_token = None
    user_id = None
    user_email = "locust_user@example.com"
    user_password = "locustpassword"

    def on_start(self):
        """On start, register and then log in the user."""
        self.register_and_login()

    def register_and_login(self):
        # Try to register first, if email exists, proceed to login
        register_response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": self.user_email,
                "password": self.user_password,
                "full_name": "Locust Test User"
            },
            catch_response=True
        )
        if register_response.status_code == 201:
            register_response.success()
            self.user_id = register_response.json().get("id")
            print(f"Locust user {self.user_email} registered.")
        elif register_response.status_code == 409:
            register_response.success() # Treat conflict as success if user already exists
            print(f"Locust user {self.user_email} already exists.")
        else:
            register_response.failure(f"Failed to register: {register_response.text}")
            return # Abort if registration truly failed

        # Always try to login after ensuring user exists
        login_response = self.client.post(
            "/api/v1/auth/login",
            data={
                "username": self.user_email,
                "password": self.user_password
            },
            catch_response=True
        )
        if login_response.status_code == 200:
            login_response.success()
            data = login_response.json()
            self.access_token = data["access_token"]
            self.refresh_token = data["refresh_token"]
            print(f"Locust user {self.user_email} logged in.")
        else:
            login_response.failure(f"Failed to login: {login_response.text}")

    @task(1)
    def get_items(self):
        """Authenticated user gets their items."""
        if not self.access_token:
            self.register_and_login() # Ensure logged in
            if not self.access_token:
                self.environment.runner.quit() # Cannot proceed without token

        with self.client.get(
            "/api/v1/items/",
            headers={"Authorization": f"Bearer {self.access_token}"},
            catch_response=True
        ) as response:
            if response.status_code == 401:
                print(f"Access token expired for {self.user_email}. Attempting refresh.")
                # This basic Locust script does not implement full refresh token logic.
                # In a real scenario, you'd call /auth/refresh here.
                # For simplicity in Locust, we might force a re-login or just fail this request.
                response.failure("Access token expired")
                self.access_token = None # Invalidate token to force re-login on next task
                self.register_and_login()
            elif response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to get items: {response.text}")

    @task(2)
    def create_item(self):
        """Authenticated user creates an item."""
        if not self.access_token:
            self.get_items() # Try to get items, which will trigger re-login if needed
            if not self.access_token: return # Still no token, abort

        item_data = {
            "title": f"Locust Task {self.user.environment.runner.stats.total.num_requests}",
            "description": "Created by performance test"
        }
        with self.client.post(
            "/api/v1/items/",
            json=item_data,
            headers={"Authorization": f"Bearer {self.access_token}"},
            catch_response=True
        ) as response:
            if response.status_code == 401:
                response.failure("Access token expired")
                self.access_token = None
                self.register_and_login()
            elif response.status_code == 201:
                response.success()
            else:
                response.failure(f"Failed to create item: {response.text}")

    @task(1)
    def get_me(self):
        """Authenticated user gets their own profile."""
        if not self.access_token:
            self.get_items()
            if not self.access_token: return

        with self.client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {self.access_token}"},
            catch_response=True
        ) as response:
            if response.status_code == 401:
                response.failure("Access token expired")
                self.access_token = None
                self.register_and_login()
            elif response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to get user me: {response.text}")

    # A task to simulate admin actions (requires admin user)
    # To run this, you'd need a separate user class or a mechanism to make `locust_user@example.com` an admin.
    # For simplicity, we'll keep it commented out or assume admin user setup.
    # @task(0.1) # Less frequent task
    # def admin_get_all_users(self):
    #     if self.user_email == "admin@example.com" and self.access_token:
    #         with self.client.get(
    #             "/api/v1/users/",
    #             headers={"Authorization": f"Bearer {self.access_token}"},
    #             catch_response=True
    #         ) as response:
    #             if response.status_code == 401:
    #                 response.failure("Access token expired")
    #                 self.access_token = None
    #                 self.register_and_login()
    #             elif response.status_code == 200:
    #                 response.success()
    #             else:
    #                 response.failure(f"Failed to get all users (admin): {response.text}")
```