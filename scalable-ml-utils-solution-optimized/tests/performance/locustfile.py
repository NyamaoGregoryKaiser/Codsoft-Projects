```python
from locust import HttpUser, task, between, SequentialTaskSet
import json

class UserBehavior(SequentialTaskSet):
    token = None
    user_id = None
    dataset_id = None
    model_id = None

    @task(1)
    def login(self):
        # Admin login
        response = self.client.post(
            "/api/v1/auth/login",
            data={"username": "admin@example.com", "password": "adminpassword"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.client.headers.update({"Authorization": f"Bearer {self.token}"})
            self.user_id = response.json()["id"] # Assuming /me endpoint is called by AuthContext or similar

            # Get current user to set user_id for subsequent tasks
            me_response = self.client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {self.token}"})
            if me_response.status_code == 200:
                self.user_id = me_response.json()["id"]
                print(f"Logged in as admin, user_id: {self.user_id}")
            else:
                print(f"Failed to get /me: {me_response.text}")
        else:
            print(f"Login failed: {response.text}")
            self.environment.runner.quit() # Stop if login fails

    @task(2)
    def get_datasets(self):
        if not self.token:
            return
        self.client.get("/api/v1/datasets/", headers={"Authorization": f"Bearer {self.token}"})

    @task(3)
    def upload_dataset(self):
        if not self.token:
            return
        
        # Avoid uploading too many unique files in a real test
        # For simplicity, we'll overwrite a file or create a generic one
        csv_content = "col1,col2,target\n1,a,0\n2,b,1\n3,c,0\n4,d,1\n5,e,0\n6,f,1"
        files = {"file": (f"test_dataset_{self.user_id}.csv", csv_content.encode('utf-8'), "text/csv")}
        response = self.client.post(
            "/api/v1/datasets/",
            files=files,
            headers={"Authorization": f"Bearer {self.token}"}
        )
        if response.status_code == 201:
            self.dataset_id = response.json()["id"]
            print(f"Uploaded dataset {self.dataset_id}")
        else:
            print(f"Failed to upload dataset: {response.text}")

    @task(4)
    def get_dataset_detail(self):
        if not self.token or not self.dataset_id:
            return
        self.client.get(f"/api/v1/datasets/{self.dataset_id}", headers={"Authorization": f"Bearer {self.token}"})

    @task(5)
    def train_model(self):
        if not self.token or not self.dataset_id:
            return
        
        model_name = f"test_model_{self.dataset_id}"
        train_data = {
            "name": model_name,
            "model_type": "classification",
            "dataset_id": self.dataset_id,
            "target_column": "target",
            "features": ["col1", "col2"]
        }
        response = self.client.post(
            "/api/v1/models/train",
            json=train_data,
            headers={"Authorization": f"Bearer {self.token}"}
        )
        if response.status_code == 201:
            self.model_id = response.json()["id"]
            print(f"Trained model {self.model_id}")
        else:
            print(f"Failed to train model: {response.text}")
            # If training fails, subsequent tasks depending on model_id will fail or skip
            # For robustness, we might want to handle this more gracefully, e.g., retry or log.

    @task(6)
    def get_models(self):
        if not self.token:
            return
        self.client.get("/api/v1/models/", headers={"Authorization": f"Bearer {self.token}"})

    @task(7)
    def predict(self):
        if not self.token or not self.model_id:
            return
        
        predict_data = {
            "model_id": self.model_id,
            "data": [
                {"col1": 1, "col2": "a"},
                {"col1": 2, "col2": "b"},
            ]
        }
        self.client.post(
            "/api/v1/models/predict",
            json=predict_data,
            headers={"Authorization": f"Bearer {self.token}"}
        )

    @task(8)
    def get_experiments(self):
        if not self.token:
            return
        self.client.get("/api/v1/experiments/", headers={"Authorization": f"Bearer {self.token}"})

class MLUser(HttpUser):
    wait_time = between(1, 5) # Users wait 1 to 5 seconds between tasks
    host = "http://localhost:8000" # Target the backend service
    tasks = [UserBehavior]

```