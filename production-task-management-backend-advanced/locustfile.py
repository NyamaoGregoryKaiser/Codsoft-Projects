from locust import HttpUser, task, between
import os

class TaskManagementUser(HttpUser):
    wait_time = between(1, 2.5)  # Users wait between 1 to 2.5 seconds between tasks

    host = os.getenv("LOCUST_HOST", "http://localhost:8000") # Default to local backend

    # Assume a valid user for testing exists and we can log in
    # In a real scenario, you'd register users or use pre-existing ones
    # For simplicity, we use the hardcoded admin, but ideally, create users programmatically
    admin_email = os.getenv("FIRST_SUPERUSER_EMAIL", "admin@example.com")
    admin_password = os.getenv("FIRST_SUPERUSER_PASSWORD", "adminpassword")
    
    auth_headers = {}
    test_project_id = None
    test_task_id = None

    def on_start(self):
        """On start of user, login and get a token."""
        self.login()
        self.create_test_project()
        self.create_test_task()

    def login(self):
        login_data = {
            "username": self.admin_email,
            "password": self.admin_password
        }
        response = self.client.post("/api/v1/auth/login", data=login_data, name="/auth/login")
        if response.status_code == 200:
            self.auth_headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
            print(f"Logged in as {self.admin_email}")
        else:
            print(f"Login failed for {self.admin_email}: {response.text}")
            self.environment.runner.quit() # Stop if login fails

    def create_test_project(self):
        project_data = {"title": "Locust Test Project", "description": "Project created by Locust for testing."}
        response = self.client.post("/api/v1/projects/", json=project_data, headers=self.auth_headers, name="/projects/create", catch_response=True)
        if response.status_code == 201:
            self.test_project_id = response.json()["id"]
            print(f"Created test project: {self.test_project_id}")
        elif response.status_code == 409: # Conflict, project might exist from previous run
            print("Test project already exists, trying to find it...")
            resp = self.client.get("/api/v1/projects/", headers=self.auth_headers, name="/projects/get_all")
            if resp.status_code == 200:
                projects = [p for p in resp.json() if p["title"] == "Locust Test Project"]
                if projects:
                    self.test_project_id = projects[0]["id"]
                    print(f"Found existing test project: {self.test_project_id}")
            if not self.test_project_id:
                 print(f"Failed to find or create test project: {response.text}")
                 self.environment.runner.quit()
        else:
            print(f"Failed to create test project: {response.text}")
            self.environment.runner.quit()
    
    def create_test_task(self):
        if not self.test_project_id:
            print("No test project ID, cannot create task.")
            return

        task_data = {
            "title": "Locust Test Task",
            "description": "Task for performance testing.",
            "project_id": self.test_project_id,
            "status": "Open",
            "priority": "Medium",
            "creator_id": 1 # Assume admin is user ID 1, needs to be dynamic in a real app
        }
        response = self.client.post("/api/v1/tasks/", json=task_data, headers=self.auth_headers, name="/tasks/create", catch_response=True)
        if response.status_code == 201:
            self.test_task_id = response.json()["id"]
            print(f"Created test task: {self.test_task_id}")
        elif response.status_code == 409: # Could be duplicate if run multiple times
            print("Test task might already exist.")
            resp = self.client.get(f"/api/v1/tasks/?project_id={self.test_project_id}", headers=self.auth_headers, name="/tasks/get_by_project")
            if resp.status_code == 200:
                tasks = [t for t in resp.json() if t["title"] == "Locust Test Task"]
                if tasks:
                    self.test_task_id = tasks[0]["id"]
                    print(f"Found existing test task: {self.test_task_id}")
            if not self.test_task_id:
                print(f"Failed to find or create test task: {response.text}")
                self.environment.runner.quit()
        else:
            print(f"Failed to create test task: {response.text}")
            self.environment.runner.quit()

    @task(3) # 3 times more likely to execute than other tasks
    def get_all_projects(self):
        self.client.get("/api/v1/projects/", headers=self.auth_headers, name="/projects/get_all")

    @task(5)
    def get_tasks_for_project(self):
        if self.test_project_id:
            self.client.get(f"/api/v1/tasks/?project_id={self.test_project_id}", headers=self.auth_headers, name="/tasks/get_by_project")
        else:
            self.client.get("/api/v1/tasks/", headers=self.auth_headers, name="/tasks/get_all")

    @task(2)
    def get_specific_task_and_comments(self):
        if self.test_task_id:
            self.client.get(f"/api/v1/tasks/{self.test_task_id}", headers=self.auth_headers, name="/tasks/{id}")
            self.client.get(f"/api/v1/comments/task/{self.test_task_id}/", headers=self.auth_headers, name="/comments/task/{id}")
        else:
            print("Test task ID not available for specific task/comments test.")

    @task(1)
    def update_task_status(self):
        if self.test_task_id:
            new_status = "In Progress" if self.test_task_id % 2 == 0 else "Review" # Alternate status
            self.client.put(
                f"/api/v1/tasks/{self.test_task_id}",
                json={"status": new_status},
                headers=self.auth_headers,
                name="/tasks/update_status"
            )
        else:
            print("Test task ID not available for update task status test.")

    @task(1)
    def add_comment_to_task(self):
        if self.test_task_id:
            comment_data = {"content": f"New comment from Locust at {self.environment.stats.start_time}.", "task_id": self.test_task_id}
            self.client.post(
                "/api/v1/comments/",
                json=comment_data,
                headers=self.auth_headers,
                name="/comments/create"
            )
        else:
            print("Test task ID not available for add comment test.")

# To run:
# 1. Start your docker-compose services (db, redis, backend)
#    cd task-management-system && docker-compose up -d --build
# 2. Run Locust (from the project root, or anywhere with path to locustfile.py)
#    locust -f locustfile.py
# 3. Open http://localhost:8089 in your browser