```markdown
# Database Layer Documentation

This directory contains the necessary files for setting up and managing the PostgreSQL database for the Mobile Backend system.

## Schema Definition

The database schema is defined in SQL migration scripts. We follow a versioned migration approach to manage database changes over time.

- `V1__initial_schema.sql`: Defines the initial database tables:
    - `users`: Stores user information, including authentication credentials.
    - `products`: Stores details about available products.
    - `orders`: Stores overall order information.
    - `order_items`: Links products to specific orders, including quantity and price at the time of purchase.

Each table includes standard fields like `id` (UUID), `created_at`, and `updated_at`. Triggers are used to automatically update `updated_at` on record modification.

## Migration Scripts

Migration scripts are named using a `V<version>__<description>.sql` convention. This allows for clear tracking of database changes.

- **`V1__initial_schema.sql`**:
    - Creates `users`, `products`, `orders`, and `order_items` tables.
    - Adds `UUID` primary keys with `uuid_generate_v4()` as default.
    - Defines foreign key constraints to maintain referential integrity.
    - Creates indexes on frequently queried columns (`email`, `name`, `user_id`, `order_id`, `product_id`) for performance.
    - Implements `updated_at` triggers for automatic timestamp updates.

- **`V2__seed_data.sql`**:
    - Populates the database with initial sample data for `users`, `products`, `orders`, and `order_items`.
    - Includes an admin user, a regular user, several products, and a couple of orders with their respective items.
    - Password hashes for seed users are bcrypt hashes for "password123".
    - Uses `ON CONFLICT DO NOTHING` to make scripts idempotent, allowing them to be run multiple times without error if data already exists.

## How to Apply Migrations

In a production environment, tools like Flyway, Alembic (for Python), or custom migration runners would be used. For this project, with Docker Compose, you can apply migrations manually or via a script after the database container is up.

**Steps using `psql` (after `docker-compose up`):**

1.  **Ensure PostgreSQL is running**:
    ```bash
    docker-compose -f docker/docker-compose.yml up -d postgres
    ```
2.  **Copy migration scripts into the container (if not mounted)**:
    ```bash
    docker cp database/migrations/V1__initial_schema.sql postgres:/tmp/V1__initial_schema.sql
    docker cp database/migrations/V2__seed_data.sql postgres:/tmp/V2__seed_data.sql
    ```
    *Note: In `docker-compose.yml`, these are typically mounted via volumes for convenience.*

3.  **Execute the migration scripts**:
    ```bash
    # Connect to the database and run V1
    docker-compose -f docker/docker-compose.yml exec postgres psql -h localhost -p 5432 -U mobile_user -d mobile_backend_db -f /tmp/V1__initial_schema.sql

    # Execute V2 for seed data
    docker-compose -f docker/docker-compose.yml exec postgres psql -h localhost -p 5432 -U mobile_user -d mobile_backend_db -f /tmp/V2__seed_data.sql
    ```
    You might be prompted for the `mobile_user` password, which is `mobile_password` as per `.env.example`.

## Query Optimization

Several strategies are employed for query optimization:

1.  **Indexing**:
    -   Indexes are created on `email` (for user lookup), `name` (for product lookup), `user_id` (for orders by user), and `order_id`/`product_id` (for order items). This speeds up `SELECT` operations on these columns.
2.  **UUIDs for Primary Keys**:
    -   Using UUIDs as primary keys distributes inserts more evenly across index pages, reducing contention in highly concurrent systems compared to sequential integers.
3.  **`updated_at` Timestamps**:
    -   Automatically updated timestamps help in quickly identifying recently modified records for caching or synchronization purposes.
4.  **Foreign Key Constraints**:
    -   Ensure data integrity and can sometimes help the query planner, but primarily for data correctness. `ON DELETE CASCADE` is used for `orders` linked to `users`, meaning if a user is deleted, their orders are also deleted. `ON DELETE RESTRICT` is used for `order_items` linked to `products` to prevent deleting a product if it's part of an existing order.
5.  **Pagination (Application Layer)**:
    -   The application layer (e.g., `UserService`, `ProductService`) will implement pagination (`LIMIT`, `OFFSET`) for endpoints that return lists of resources to prevent fetching excessively large datasets. This is crucial for mobile clients.
6.  **Connection Pooling**:
    -   Drogon's built-in database client uses connection pooling, reducing the overhead of establishing new database connections for each request.

For further optimization in a real-world scenario, tools like `EXPLAIN ANALYZE` in PostgreSQL would be used to inspect query plans and identify bottlenecks.
```