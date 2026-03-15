# Performance Testing Considerations for CMS Project

Performance testing is crucial for an enterprise-grade application to ensure it can handle expected load, maintain responsiveness, and scale efficiently.

## 1. Types of Performance Tests

*   **Load Testing**: Verify system behavior under anticipated peak load.
*   **Stress Testing**: Determine the system's breaking point by pushing it beyond normal operating capacity.
*   **Scalability Testing**: Evaluate the system's ability to scale up or down (e.g., adding more backend instances, increasing database resources) and maintain performance.
*   **Soak Testing (Endurance Testing)**: Check for memory leaks or degradation over a long period under sustained load.

## 2. Key Metrics to Monitor

*   **Response Time**: Time taken for an API request to return a response (e.g., average, 90th percentile, 99th percentile).
*   **Throughput**: Number of requests processed per second.
*   **Error Rate**: Percentage of requests that result in errors.
*   **Resource Utilization**: CPU, Memory, Disk I/O, Network I/O of application servers, database, cache.
*   **Database Metrics**: Query execution times, connection pool usage, cache hit ratio.
*   **Cache Metrics**: Cache hit/miss rates for Redis.

## 3. Tools for Performance Testing

*   **Locust**: An open-source load testing tool. You define user behavior with Python code.
*   **JMeter**: A popular Apache tool for load testing and performance measurement.
*   **k6**: Modern load testing tool that uses JavaScript for scripting.
*   **Gatling**: Scala-based load testing tool known for its DSL.
*   **Prometheus & Grafana**: For monitoring metrics over time.
*   **New Relic, Datadog, Sentry**: APM (Application Performance Monitoring) tools for in-depth insights.

## 4. Performance Test Scenarios (Examples)

*   **Public Content Browsing**:
    *   Simulate anonymous users browsing published posts, pages, categories, and tags.
    *   High concurrency. Expect caching to be very effective here.
*   **Authenticated User Dashboard/Content List**:
    *   Simulate authenticated users accessing their dashboard, listing their own posts/pages, or viewing publicly available content.
    *   Moderate concurrency, testing user-specific data retrieval and caching.
*   **Content Creation/Update**:
    *   Simulate users creating new posts, pages, categories, or tags.
    *   Focus on database write performance and impact on read operations (cache invalidation).
*   **Media Upload**:
    *   Simulate concurrent file uploads.
    *   Monitor disk I/O, network bandwidth, and storage service performance.
*   **User Authentication**:
    *   Simulate concurrent login/registration requests.
    *   Monitor JWT token generation and validation overhead.

## 5. Implementing a Basic Locust Test (Conceptual)

To perform load tests, you would typically define user tasks in a file like `locustfile.py`.

```python
# === backend/locustfile.py ===
import time
from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 5)  # Users wait between 1 and 5 seconds between tasks

    # Base host for the API, should point to your backend service (e.g., http://localhost:8000)
    host = "http://backend:8000"

    def on_start(self):
        """ on_start is called when a Locust user starts hatching """
        self.login_token = None
        self.user_id = None
        self.do_login()

    def do_login(self):
        """ Authenticate user and store token """
        response = self.client.post("/api/v1/auth/token/", json={"username":"editor", "password":"editorpassword"})
        if response.status_code == 200:
            self.login_token = response.json()['access']
            self.user_id = response.json()['user']['id']
            self.client.headers.update({"Authorization": f"Bearer {self.login_token}"})
        else:
            print(f"Login failed: {response.status_code} - {response.text}")

    @task(3) # 3 times more likely to browse public content
    def browse_public_posts(self):
        """ Browse published posts as any user (cached) """
        self.client.get("/api/v1/posts/?status=published", name="/api/v1/posts/published", verify=False)

    @task(2) # 2 times more likely for authenticated actions
    def get_user_profile(self):
        """ Get authenticated user's profile """
        if self.login_token:
            self.client.get("/api/v1/auth/me/", verify=False)
        else:
            self.do_login()

    @task(1) # Less frequent task
    def create_draft_post(self):
        """ Create a new draft post """
        if self.login_token:
            post_data = {
                "title": f"Test Post by editor {self.user_id} - {time.time()}",
                "content": "This is content for a test draft post.",
                "excerpt": "A short summary for the draft.",
                "status": "draft",
                "category_ids": [1], # Assuming category with ID 1 exists
                "tag_ids": [1, 2] # Assuming tags with IDs 1, 2 exist
            }
            self.client.post("/api/v1/posts/", json=post_data, name="/api/v1/posts/create", verify=False)
        else:
            self.do_login()

    @task(1)
    def upload_media_item(self):
        """ Upload a small dummy media item """
        if self.login_token:
            files = {'file': ('dummy.txt', b'This is a dummy file content for upload.', 'text/plain')}
            data = {'title': f"Dummy File by editor {self.user_id} - {time.time()}"}
            self.client.post("/api/v1/media/", files=files, data=data, name="/api/v1/media/upload", verify=False)
        else:
            self.do_login()

    @task(0) # Not a very frequent task, but important for endurance tests
    def refresh_access_token(self):
        """ Refresh JWT token """
        if self.login_token: # Check if access_token exists to get refresh token
            # Note: Locust needs to be configured to store refresh_token from login
            # For simplicity, let's assume `self.refresh_token` is stored from `do_login`
            # In a real scenario, you'd parse it from the /token/ response.
            # Here, we'll just re-login to simulate token acquisition if it expires.
            pass # The interceptor logic in frontend axios handles this automatically.
                 # For backend-only load testing, you'd explicitly refresh.
                 # Re-login upon failure is a simple way to simulate.

```
*   **To run Locust**:
    1.  Ensure Docker services are running (`docker-compose up`).
    2.  Install Locust: `pip install locust` (outside of the Docker container, or in a separate `locust` service).
    3.  Run from `backend/` directory: `locust -f locustfile.py`
    4.  Open your browser to `http://localhost:8089` (or the port Locust starts on).

## 6. Continuous Performance Monitoring

Integrate APM tools (e.g., Sentry, Datadog) to continuously monitor the application's performance in production. Set up alerts for deviations from baseline metrics (e.g., high error rates, slow response times, excessive resource usage).

## 7. Performance Optimization Strategies

*   **Database Indexing**: Properly index frequently queried columns.
*   **Query Optimization**: Use `select_related` and `prefetch_related` in Django to minimize database queries (N+1 problem).
*   **Caching**: Implement caching for frequently accessed data (Redis integrated in settings).
*   **Asynchronous Tasks**: Use Celery with Redis/RabbitMQ for long-running tasks (e.g., image processing, email sending) to avoid blocking web requests.
*   **Load Balancing**: Distribute traffic across multiple instances of the backend application.
*   **CDN**: Use a Content Delivery Network for serving static and media files.
*   **Frontend Optimization**: Minify assets, lazy load images, optimize bundle size, implement client-side caching.
*   **Web Server Optimization**: Configure Nginx/Gunicorn for optimal performance.