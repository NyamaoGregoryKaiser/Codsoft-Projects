```sql
-- Add foreign key constraints to orders table
ALTER TABLE orders
ADD CONSTRAINT fk_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE; -- If a user is deleted, their orders are also deleted. Adjust as per business logic.
```