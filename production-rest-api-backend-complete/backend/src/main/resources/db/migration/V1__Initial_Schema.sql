CREATE TABLE _user (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

CREATE TABLE product (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL
);

CREATE TABLE _order (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    order_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES _user(id) ON DELETE CASCADE
);

CREATE TABLE order_item (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    price_at_order DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_order FOREIGN KEY(order_id) REFERENCES _order(id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES product(id) ON DELETE CASCADE
);

-- Index for frequently accessed columns
CREATE INDEX idx_user_email ON _user(email);
CREATE INDEX idx_product_name ON product(name);
CREATE INDEX idx_order_user_id ON _order(user_id);
CREATE INDEX idx_order_item_order_id ON order_item(order_id);
CREATE INDEX idx_order_item_product_id ON order_item(product_id);