from locust import HttpUser, task, between
import json

class ProjectFlowUser(HttpUser):
    wait_time = between(1, 2.5) # Users wait between 1 and 2.5 seconds between tasks
    host = "http://localhost:5000" # Target host of your Flask app

    # Store auth tokens and user IDs for subsequent requests
    access_token = None
    refresh_token = None
    user_id = None
    is_admin = False
    project_id = None # Store a project ID to interact with

    def on_start(self):
        """
        Called when a Locust user starts. We'll log in the user here.
        """
        self.login()

    def login(self):
        username = "locust_user"
        password = "locust_password"
        email = f"locust_user_{self.environment.runner.user_count}@example.com" # Unique email per user

        # Attempt to register first, if user already exists, it will fail (409), then try to login
        reg_response = self.client.post("/api/v1/auth/register", json={"username": username, "email": email, "password": password}, catch_response=True)
        if reg_response.status_code == 409:
            print(f"User {username} already exists, attempting login...")
        elif reg_response.status_code == 201:
            print(f"User {username} registered successfully.")
        else:
            reg_response.failure(f"Failed to register user: {reg_response.text}")

        login_response = self.client.post("/api/v1/auth/login", json={"username": username, "password": password})
        if login_response.status_code == 200:
            self.access_token = login_response.json()["access_token"]
            self.refresh_token = login_response.json()["refresh_token"]
            self.user_id = login_response.json()["user"]["id"]
            self.is_admin = login_response.json()["user"]["is_admin"]
            print(f"Logged in as {username} (ID: {self.user_id})")
        else:
            print(f"Login failed: {login_response.text}")
            self.environment.runner.quit() # Stop if login fails

    def get_headers(self):
        return {"Authorization": f"Bearer {self.access_token}"} if self.access_token else {}

    @task(3) # This task is executed 3 times more often than others
    def get_all_projects(self):
        with self.client.get("/api/v1/projects/", headers=self.get_headers(), catch_response=True) as response:
            if response.status_code == 200:
                projects = response.json().get("projects")
                if projects:
                    self.project_id = projects[0]["id"] # Store first project ID for task operations
                response.success("Get all projects successful")
            else:
                response.failure(f"Failed to get projects: {response.text}")

    @task(2)
    def create_project(self):
        project_name = f"Project {self.user_id}-{self.environment.runner.stats.total.num_requests}" # Unique name
        with self.client.post("/api/v1/projects/",
                              headers=self.get_headers(),
                              json={"name": project_name, "description": "Stress test project"},
                              catch_response=True) as response:
            if response.status_code == 201:
                self.project_id = response.json()["id"]
                response.success("Project created successfully")
            elif response.status_code == 409: # Already exists
                response.success("Project already exists (expected behavior in some cases)")
            else:
                response.failure(f"Failed to create project: {response.text}")

    @task(5)
    def get_project_tasks(self):
        if self.project_id:
            with self.client.get(f"/api/v1/tasks/project/{self.project_id}", headers=self.get_headers(), catch_response=True) as response:
                if response.status_code == 200:
                    response.success("Get project tasks successful")
                else:
                    response.failure(f"Failed to get project tasks: {response.text}")
        else:
            print("No project_id to query tasks for, skipping.")
            # self.environment.runner.stats.log_request("GET", "/api/v1/tasks/project/{id}", 0, 0, "No Project ID")

    @task(1)
    def create_task(self):
        if self.project_id:
            task_title = f"Task for Project {self.project_id} - {self.environment.runner.stats.total.num_requests}"
            with self.client.post(f"/api/v1/tasks/project/{self.project_id}",
                                  headers=self.get_headers(),
                                  json={"title": task_title, "status": "todo", "priority": "medium"},
                                  catch_response=True) as response:
                if response.status_code == 201:
                    response.success("Task created successfully")
                else:
                    response.failure(f"Failed to create task: {response.text}")
        else:
            print("No project_id to create tasks for, skipping.")
            # self.environment.runner.stats.log_request("POST", "/api/v1/tasks/project/{id}", 0, 0, "No Project ID")

    @task(0) # This task is less frequent
    def get_all_users(self):
        if self.is_admin:
            with self.client.get("/api/v1/users/", headers=self.get_headers(), catch_response=True) as response:
                if response.status_code == 200:
                    response.success("Get all users successful")
                else:
                    response.failure(f"Failed to get users: {response.text}")
        else:
            pass # Non-admin users can't perform this task (or it would be a 403)
```