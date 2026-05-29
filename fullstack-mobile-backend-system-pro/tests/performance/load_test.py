from locust import HttpUser, task, between
import json

class MobileShopUser(HttpUser):
    wait_time = between(1, 5)  # Users wait between 1 and 5 seconds between tasks
    host = "http://localhost:8000" # Or your deployed backend URL

    # Store JWT token for authenticated requests
    token = None
    headers = {}

    def on_start(self):
        """
        Called when a Locust user starts running.
        Performs user login to get an authentication token.
        """
        self.login_user('user1@example.com', 'userpassword1')

    def login_user(self, email, password):
        login_url = "/api/token/"
        response = self.client.post(login_url, json={"email": email, "password": password}, catch_response=True)
        if response.status_code == 200:
            self.token = response.json().get('access')
            self.headers = {"Authorization": f"Bearer {self.token}"}
            response.success()
        else:
            response.failure(f"Login failed for {email}: {response.text}")
            self.environment.runner.quit() # Stop the test if login fails

    @task(3) # Higher weight for browsing products
    def browse_products(self):
        """Browse a list of products."""
        with self.client.get("/api/products/?page_size=20", headers=self.headers, catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to browse products: {response.text}")

    @task(2) # Medium weight for viewing a specific product
    def view_product_detail(self):
        """View a specific product detail."""
        product_ids = [1, 2] # Assuming product IDs exist
        product_id = self.environment.stats.get_current_user_count() % len(product_ids) + 1 # Simple rotation
        with self.client.get(f"/api/products/{product_id}/", headers=self.headers, catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to view product {product_id}: {response.text}")

    @task(1) # Lower weight for creating an order
    def create_order(self):
        """Create a new order."""
        if not self.token:
            self.login_user('user1@example.com', 'userpassword1') # Re-login if token is lost for some reason
            if not self.token: return

        # Assuming product IDs 1 and 2 exist and have sufficient stock
        order_payload = {
            "shipping_address": "123 Test Street, Test City, TS 12345",
            "payment_method": "Locust Pay",
            "items": [
                {"product": 1, "quantity": 1},
                {"product": 2, "quantity": 1}
            ]
        }
        with self.client.post("/api/orders/", headers=self.headers, json=order_payload, catch_response=True) as response:
            if response.status_code == 201:
                response.success()
            else:
                # Log actual error detail for debugging
                error_detail = response.json() if response.content else response.text
                response.failure(f"Failed to create order: {response.status_code} - {error_detail}")

    @task(1) # Lower weight for viewing user profile
    def view_user_profile(self):
        """View the authenticated user's profile."""
        if not self.token:
            self.login_user('user1@example.com', 'userpassword1')
            if not self.token: return

        with self.client.get("/api/users/profile/", headers=self.headers, catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to view user profile: {response.text}")

# To run Locust:
# 1. Ensure your Django app is running (e.g., via docker-compose up)
# 2. Make sure you have seed data for users and products.
#    (e.g., `python manage.py seed_data` if using the provided management command).
# 3. Navigate to the `tests/performance` directory.
# 4. Run `locust -f load_test.py`
# 5. Open your browser to http://localhost:8089 (default Locust web UI port)
--- END FILE ---

### **5. Documentation**

---