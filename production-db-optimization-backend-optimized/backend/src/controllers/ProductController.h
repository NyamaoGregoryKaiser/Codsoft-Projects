```cpp
#ifndef PRODUCT_CONTROLLER_H
#define PRODUCT_CONTROLLER_H

#include <pistache/http.h>
#include <pistache/router.h>
#include <string>
#include "services/ProductService.h"

class ProductController {
public:
    void createProduct(const Pistache::Http::Request& request, Pistache::Http::ResponseWriter response);
    void getProducts(const Pistache::Http::Request& request, Pistache::Http::ResponseWriter response);
    void getProductById(const Pistache::Http::Request& request, Pistache::Http::ResponseWriter response);
    void updateProduct(const Pistache::Http::Request& request, Pistache::Http::ResponseWriter response);
    void deleteProduct(const Pistache::Http::Request& request, Pistache::Http::ResponseWriter response);

private:
    ProductService productService;
};

#endif // PRODUCT_CONTROLLER_H
```