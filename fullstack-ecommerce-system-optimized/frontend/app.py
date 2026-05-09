```python
import os
import requests
from flask import Flask, render_template, request, redirect, url_for, flash, session
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "super_secret_key_default")

# FastAPI Backend URL
FASTAPI_BASE_URL = os.getenv("FASTAPI_BASE_URL", "http://localhost:8000/api/v1")

def get_auth_headers():
    """Returns authorization headers if a token exists in the session."""
    token = session.get("access_token")
    if token:
        return {"Authorization": f"Bearer {token}"}
    return {}

def make_api_request(method, endpoint, json_data=None, params=None):
    """Helper function to make requests to the FastAPI backend."""
    headers = get_auth_headers()
    url = f"{FASTAPI_BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=json_data, params=params)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=json_data, params=params)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, params=params)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")

        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        return response.json()
    except requests.exceptions.HTTPError as e:
        flash(f"API Error: {e.response.status_code} - {e.response.json().get('detail', 'Unknown error')}", "danger")
        if e.response.status_code == 401: # Unauthorized
            session.pop("access_token", None)
            session.pop("user_email", None)
            return redirect(url_for("login"))
        return None
    except requests.exceptions.ConnectionError:
        flash("Could not connect to the backend API. Please ensure it's running.", "danger")
        return None
    except Exception as e:
        flash(f"An unexpected error occurred: {e}", "danger")
        return None


@app.route("/")
def index():
    products = make_api_request("GET", "/products/")
    categories = make_api_request("GET", "/categories/")
    return render_template("index.html", products=products, categories=categories, user_email=session.get("user_email"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        
        # FastAPI's /login/access-token expects form data, not JSON
        login_data = {"username": email, "password": password}
        try:
            response = requests.post(f"{FASTAPI_BASE_URL}/login/access-token", data=login_data)
            response.raise_for_status()
            token_data = response.json()
            session["access_token"] = token_data["access_token"]
            session["user_email"] = email # Store email for display
            flash("Logged in successfully!", "success")
            return redirect(url_for("index"))
        except requests.exceptions.HTTPError as e:
            flash(f"Login failed: {e.response.json().get('detail', 'Invalid credentials')}", "danger")
        except requests.exceptions.ConnectionError:
            flash("Could not connect to the backend API.", "danger")
        except Exception as e:
            flash(f"An unexpected error occurred: {e}", "danger")

    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        full_name = request.form["full_name"]
        
        user_data = {"email": email, "password": password, "full_name": full_name}
        user = make_api_request("POST", "/register", json_data=user_data)
        if user:
            flash("Registration successful! Please log in.", "success")
            return redirect(url_for("login"))
    return render_template("register.html")

@app.route("/logout")
def logout():
    session.pop("access_token", None)
    session.pop("user_email", None)
    flash("You have been logged out.", "info")
    return redirect(url_for("index"))

@app.route("/products")
def products():
    search_query = request.args.get('search')
    category_id = request.args.get('category_id')

    params = {}
    if search_query:
        params['search'] = search_query
    if category_id:
        params['category_id'] = category_id

    products_data = make_api_request("GET", "/products/", params=params)
    categories_data = make_api_request("GET", "/categories/")
    
    return render_template("products.html", products=products_data, categories=categories_data,
                           search_query=search_query, selected_category_id=category_id,
                           user_email=session.get("user_email"))

@app.route("/products/<int:product_id>")
def product_detail(product_id):
    product = make_api_request("GET", f"/products/{product_id}")
    if not product:
        return redirect(url_for("products")) # Product not found or error occurred

    # Fetch reviews for the product
    reviews = make_api_request("GET", f"/reviews/product/{product_id}")
    
    return render_template("product_detail.html", product=product, reviews=reviews, user_email=session.get("user_email"))

@app.route("/add_to_cart/<int:product_id>", methods=["POST"])
def add_to_cart(product_id):
    if not session.get("access_token"):
        flash("Please log in to add items to your cart.", "warning")
        return redirect(url_for("login"))

    quantity = int(request.form.get("quantity", 1))
    item_data = {"product_id": product_id, "quantity": quantity}
    cart = make_api_request("POST", "/carts/items", json_data=item_data)
    if cart:
        flash(f"Added {quantity} of product {product_id} to cart!", "success")
    return redirect(url_for("product_detail", product_id=product_id))

@app.route("/cart")
def view_cart():
    if not session.get("access_token"):
        flash("Please log in to view your cart.", "warning")
        return redirect(url_for("login"))
    
    cart = make_api_request("GET", "/carts/")
    return render_template("cart.html", cart=cart, user_email=session.get("user_email"))

@app.route("/cart/update/<int:product_id>", methods=["POST"])
def update_cart_item(product_id):
    if not session.get("access_token"):
        return redirect(url_for("login")) # Should ideally be caught by frontend
    
    quantity = int(request.form.get("quantity", 0))
    update_data = {"quantity": quantity}
    cart = make_api_request("PUT", f"/carts/items/{product_id}", json_data=update_data)
    if cart:
        flash("Cart updated successfully!", "success")
    return redirect(url_for("view_cart"))

@app.route("/cart/remove/<int:product_id>", methods=["POST"])
def remove_from_cart(product_id):
    if not session.get("access_token"):
        return redirect(url_for("login"))
    
    cart = make_api_request("DELETE", f"/carts/items/{product_id}")
    if cart:
        flash("Item removed from cart!", "success")
    return redirect(url_for("view_cart"))

@app.route("/checkout", methods=["POST"])
def checkout():
    if not session.get("access_token"):
        flash("Please log in to checkout.", "warning")
        return redirect(url_for("login"))
    
    order = make_api_request("POST", "/orders/")
    if order:
        flash(f"Order {order['id']} placed successfully!", "success")
        return redirect(url_for("view_orders"))
    
    return redirect(url_for("view_cart")) # If order failed, return to cart with error

@app.route("/orders")
def view_orders():
    if not session.get("access_token"):
        flash("Please log in to view your orders.", "warning")
        return redirect(url_for("login"))
    
    orders = make_api_request("GET", "/orders/")
    return render_template("orders.html", orders=orders, user_email=session.get("user_email"))

@app.route("/submit_review/<int:product_id>", methods=["POST"])
def submit_review(product_id):
    if not session.get("access_token"):
        flash("Please log in to submit a review.", "warning")
        return redirect(url_for("login"))

    rating = int(request.form.get("rating"))
    comment = request.form.get("comment")

    review_data = {
        "product_id": product_id,
        "rating": rating,
        "comment": comment
    }
    review = make_api_request("POST", "/reviews/", json_data=review_data)
    if review:
        flash("Review submitted successfully!", "success")
    return redirect(url_for("product_detail", product_id=product_id))


if __name__ == "__main__":
    app.run(debug=True, port=8001) # Frontend runs on a different port
```