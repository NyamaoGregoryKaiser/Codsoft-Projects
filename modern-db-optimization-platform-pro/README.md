---

## 4. Query Analyzer Endpoints

### `GET /api/databases/:id/queries/slow`

Retrieves a list of slow queries identified for a specific target database.

*   **Authentication:** Required
*   **Path Parameters:**
    *   `id` (integer): The ID of the target database.
*   **Response (200 OK):** `application/json` (array of `SlowQuery` objects, ordered by `total_time` DESC)