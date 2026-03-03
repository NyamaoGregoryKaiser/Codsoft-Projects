```bash
#!/bin/bash

BASE_URL="http://localhost:8080/api/v1"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="adminpass" # This needs to match the seeded password + salt logic if not using a fixed hash

ACCESS_TOKEN=""
REFRESH_TOKEN=""

# --- Helper function for JSON pretty print ---
pretty_json() {
  python3 -m json.tool 2>/dev/null || cat
}

# --- 1. Admin Login (Get initial tokens) ---
echo "--- 1. Logging in as admin ---"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'"$ADMIN_USERNAME"'",
    "password": "'"$ADMIN_PASSWORD"'"
  }')

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r .access_token)
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r .refresh_token)

if [ -z "$ACCESS_TOKEN" ] || [ -z "$REFRESH_TOKEN" ]; then
  echo "ERROR: Admin login failed."
  echo "$LOGIN_RESPONSE" | pretty_json
  exit 1
fi
echo "Admin login successful. Access Token: ${ACCESS_TOKEN:0:20}... Refresh Token: ${REFRESH_TOKEN:0:20}..."
echo "$LOGIN_RESPONSE" | pretty_json
echo ""

# --- 2. Get Users (Admin only) ---
echo "--- 2. Fetching all users (admin access) ---"
curl -s -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | pretty_json
echo ""

# --- 3. Create a New User (Admin only) ---
echo "--- 3. Creating a new 'editor' user ---"
NEW_USER_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "editoruser",
    "email": "editor@apexcontent.com",
    "password": "editorpassword",
    "roleNames": ["editor"]
  }')
NEW_USER_ID=$(echo "$NEW_USER_RESPONSE" | jq -r .id)
echo "$NEW_USER_RESPONSE" | pretty_json
echo ""

# --- 4. Get User by ID (Admin or self) ---
echo "--- 4. Fetching the newly created editor user by ID ---"
curl -s -X GET "$BASE_URL/users/$NEW_USER_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | pretty_json
echo ""

# --- 5. Create a Content Type (Admin only) ---
echo "--- 5. Creating a new content type: 'Product' ---"
curl -s -X POST "$BASE_URL/content_types" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product",
    "slug": "product",
    "description": "Schema for e-commerce products",
    "schema": {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "price": {"type": "number"},
            "description": {"type": "string"}
        },
        "required": ["name", "price"]
    }
  }' | pretty_json
echo ""

# --- 6. Get Content Types ---
echo "--- 6. Fetching all content types ---"
curl -s -X GET "$BASE_URL/content_types" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | pretty_json
echo ""

# --- 7. Create a Content Item (Blog Post) ---
echo "--- 7. Creating a new content item (blog post) ---"
BLOG_POST_TYPE_ID=$(curl -s -X GET "$BASE_URL/content_types" -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.[] | select(.slug == "blog-post") | .id')
if [ -z "$BLOG_POST_TYPE_ID" ]; then
    echo "ERROR: Could not find 'blog-post' content type ID."
    exit 1
fi

NEW_BLOG_POST_RESPONSE=$(curl -s -X POST "$BASE_URL/content_items" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content_type_id": '$BLOG_POST_TYPE_ID',
    "slug": "my-first-blog-post",
    "title": "My First Blog Post",
    "content": {
        "summary": "This is a summary of my first blog post.",
        "body": "The full body content goes here, with all its details.",
        "tags": ["drogon", "cpp", "cms"]
    },
    "status": "draft"
  }')
NEW_BLOG_POST_ID=$(echo "$NEW_BLOG_POST_RESPONSE" | jq -r .id)
echo "$NEW_BLOG_POST_RESPONSE" | pretty_json
echo ""

# --- 8. Update a Content Item (Publish Blog Post) ---
echo "--- 8. Updating the blog post to 'published' status ---"
curl -s -X PUT "$BASE_URL/content_items/$NEW_BLOG_POST_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published",
    "title": "My Awesome First Blog Post (Published)"
  }' | pretty_json
echo ""

# --- 9. Get Content Items (Published only for non-admin, all for admin) ---
echo "--- 9. Fetching all content items (as admin) ---"
curl -s -X GET "$BASE_URL/content_items" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | pretty_json
echo ""

# --- 10. Attempt unauthorized access (expect 401/403) ---
echo "--- 10. Attempting to get users without token (expect 401) ---"
curl -s -X GET "$BASE_URL/users" | pretty_json
echo ""

echo "--- 11. Attempting to create user with editor token (not implemented, but usually 403) ---"
# First, log in as editor to get a token
EDITOR_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "editoruser",
    "password": "editorpassword"
  }')
EDITOR_ACCESS_TOKEN=$(echo "$EDITOR_LOGIN_RESPONSE" | jq -r .access_token)
if [ -z "$EDITOR_ACCESS_TOKEN" ]; then
  echo "ERROR: Editor login failed."
  echo "$EDITOR_LOGIN_RESPONSE" | pretty_json
else
  echo "Editor login successful. Attempting to create user with editor token..."
  curl -s -X POST "$BASE_URL/users" \
    -H "Authorization: Bearer $EDITOR_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "username": "unauthorized_user",
      "email": "unauthorized@apexcontent.com",
      "password": "pass",
      "roleNames": ["user"]
    }' | pretty_json
fi
echo ""

# --- 12. Token Refresh ---
echo "--- 12. Refreshing admin tokens ---"
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "'"$REFRESH_TOKEN"'"
  }')
NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r .access_token)
if [ -z "$NEW_ACCESS_TOKEN" ]; then
  echo "ERROR: Token refresh failed."
  echo "$REFRESH_RESPONSE" | pretty_json
else
  echo "Tokens refreshed successfully. New Access Token: ${NEW_ACCESS_TOKEN:0:20}..."
fi
echo "$REFRESH_RESPONSE" | pretty_json
echo ""

# --- 13. Delete a Content Item ---
echo "--- 13. Deleting the blog post ---"
curl -s -X DELETE "$BASE_URL/content_items/$NEW_BLOG_POST_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | pretty_json
echo ""

# --- 14. Delete the New User ---
echo "--- 14. Deleting the new editor user ---"
curl -s -X DELETE "$BASE_URL/users/$NEW_USER_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | pretty_json
echo ""

echo "--- All API tests completed ---"
```