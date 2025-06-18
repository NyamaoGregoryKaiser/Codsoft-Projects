//This is a highly simplified example.  A real API would require a significant framework like REST framework (if you want to build from scratch) or a web server like FastAPI, Express, or similar.

#include "database/database.h" // Assume this file handles database interactions
#include <iostream>
#include <string>
#include <nlohmann/json.hpp> // For JSON handling
using json = nlohmann::json;

//Example API endpoint
json getProduct(int id) {
    json response;
    //Database query to get product by id
    Product product = get_product_from_db(id);
    if(product.id != 0){
        response["status"] = "success";
        response["product"] = product.toJson();
    } else {
        response["status"] = "error";
        response["message"] = "Product not found";
    }
    return response;
}