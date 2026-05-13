from locust import HttpUser, task, between
import os

class PaymentProcessorUser(HttpUser):
    wait_time = between(1, 2.5) # Users wait between 1 to 2.5 seconds between tasks
    host = "http://localhost:8000" # Target host, change if running against Docker Compose service name

    # Assume a valid merchant token for testing authenticated endpoints
    # In a real scenario, you'd have a login task or fetch tokens from a pre-defined list.
    merchant_email = os.getenv("LOCUST_MERCHANT_EMAIL", "merchant1@example.com")
    merchant_password = os.getenv("LOCUST_MERCHANT_PASSWORD", "merchant_password")
    access_token = None
    merchant_id = None # Store merchant ID after login

    def on_start(self):
        """On start of user, perform login and get token."""
        self.login()
        self.get_merchant_id()

    def login(self):
        login_data = {
            "username": self.merchant_email,
            "password": self.merchant_password,
            "grant_type": "password",
            "scope": ""
        }
        response = self.client.post("/api/v1/auth/login/access-token", data=login_data, name="/auth/login")
        if response.status_code == 200:
            self.access_token = response.json()["access_token"]
            print(f"Logged in as {self.merchant_email}")
        else:
            print(f"Login failed: {response.status_code} {response.text}")
            self.environment.runner.quit() # Stop if login fails

    def get_merchant_id(self):
        """Get merchant ID after login."""
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = self.client.get("/api/v1/auth/me", headers=headers, name="/auth/me")
        if response.status_code == 200:
            self.merchant_id = response.json()["merchant"]["id"]
            print(f"Obtained merchant ID: {self.merchant_id}")
        else:
            print(f"Failed to get merchant ID: {response.status_code} {response.text}")
            self.environment.runner.quit()

    @task(3) # 3 times more likely to run than other tasks
    def initiate_payment(self):
        """Simulate initiating a payment with new card details."""
        if not self.access_token or not self.merchant_id:
            self.login()
            if not self.access_token or not self.merchant_id:
                return # Skip if login failed

        headers = {"Authorization": f"Bearer {self.access_token}"}
        customer_id = "f47ac10b-58cc-4372-a567-0e02b2c3d4e5" # Use a fixed customer for simplicity
        
        # In a real test, you might fetch customer and payment method IDs from setup data,
        # or randomly generate realistic-looking card numbers.
        # For this demo, we use a mock token directly or mock card details.
        
        # Option 1: Use new card details (will create a new PM each time, increasing DB load)
        payment_data = {
            "merchant_id": self.merchant_id,
            "customer_id": customer_id,
            "amount": round(self.environment.random.uniform(1.0, 500.0), 2),
            "currency": "USD",
            "description": f"Locust test payment {self.merchant_id}",
            "card_details": {
                "card_number": f"411122223333{self.environment.random.randint(1000,9999)}",
                "expiry_month": self.environment.random.randint(1, 12),
                "expiry_year": self.environment.random.randint(2025, 2030),
                "cvv": f"{self.environment.random.randint(100,999)}"
            }
        }
        
        # Option 2: Use an existing payment method ID (less DB load for PM creation)
        # Assumes customer_id and payment_method_id exist in your test DB
        # payment_method_id = "YOUR_KNOWN_PAYMENT_METHOD_ID_HERE" 
        # payment_data = {
        #     "merchant_id": self.merchant_id,
        #     "customer_id": customer_id,
        #     "payment_method_id": payment_method_id,
        #     "amount": round(self.environment.random.uniform(1.0, 500.0), 2),
        #     "currency": "USD",
        #     "description": f"Locust test payment {self.merchant_id}",
        # }


        with self.client.post("/api/v1/transactions/initiate", json=payment_data, headers=headers, name="/transactions/initiate", catch_response=True) as response:
            if response.status_code == 202:
                response.success()
            else:
                response.failure(f"Initiate payment failed: {response.status_code} {response.text}")

    @task(1) # Less likely
    def get_merchant_transactions(self):
        """Simulate getting all transactions for the merchant."""
        if not self.access_token or not self.merchant_id:
            self.login()
            if not self.access_token or not self.merchant_id:
                return

        headers = {"Authorization": f"Bearer {self.access_token}"}
        with self.client.get(f"/api/v1/transactions/merchant/{self.merchant_id}", headers=headers, name="/transactions/merchant", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get merchant transactions failed: {response.status_code} {response.text}")

```
*(To run Locust: `locust -f locustfile.py`. Access `http://localhost:8089` in your browser. Ensure your backend and test DB are running.)*

---

### 5. Documentation

#### `payment_processor/README.md`
```markdown