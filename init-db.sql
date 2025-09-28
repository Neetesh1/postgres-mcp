-- Initialize test database with sample data for MCP testing

-- Create some test tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);

-- Insert sample data
INSERT INTO users (name, email) VALUES
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com'),
    ('Bob Johnson', 'bob@example.com'),
    ('Alice Brown', 'alice@example.com'),
    ('Charlie Wilson', 'charlie@example.com');

INSERT INTO products (name, description, price, category, stock_quantity) VALUES
    ('Laptop Pro', 'High-performance laptop for professionals', 1299.99, 'Electronics', 25),
    ('Wireless Mouse', 'Ergonomic wireless mouse with long battery life', 29.99, 'Electronics', 150),
    ('Office Chair', 'Comfortable ergonomic office chair', 199.99, 'Furniture', 40),
    ('Coffee Mug', 'Ceramic coffee mug with company logo', 12.99, 'Office Supplies', 200),
    ('Notebook Set', 'Set of 3 professional notebooks', 24.99, 'Office Supplies', 80),
    ('Standing Desk', 'Adjustable height standing desk', 399.99, 'Furniture', 15),
    ('Bluetooth Headphones', 'Noise-cancelling wireless headphones', 149.99, 'Electronics', 60);

INSERT INTO orders (user_id, total_amount, status) VALUES
    (1, 1329.98, 'completed'),
    (2, 42.98, 'completed'),
    (3, 599.98, 'pending'),
    (1, 174.97, 'shipped'),
    (4, 12.99, 'completed');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (1, 1, 1, 1299.99),  -- John's laptop
    (1, 2, 1, 29.99),    -- John's mouse
    (2, 4, 1, 12.99),    -- Jane's mug
    (2, 2, 1, 29.99),    -- Jane's mouse
    (3, 3, 2, 199.99),   -- Bob's chairs
    (3, 6, 1, 199.99),   -- Bob's desk (discounted)
    (4, 7, 1, 149.99),   -- John's headphones
    (4, 5, 1, 24.98),    -- John's notebooks
    (5, 4, 1, 12.99);    -- Alice's mug

-- Create a view for testing
CREATE VIEW order_summary AS
SELECT 
    o.id as order_id,
    u.name as customer_name,
    u.email,
    o.total_amount,
    o.status,
    o.order_date,
    COUNT(oi.id) as item_count
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.name, u.email, o.total_amount, o.status, o.order_date
ORDER BY o.order_date DESC;

-- Create another schema for testing multi-schema support
CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE analytics.sales_summary (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    total_sales DECIMAL(12,2),
    order_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO analytics.sales_summary (date, total_sales, order_count) VALUES
    ('2024-01-15', 2159.91, 5),
    ('2024-01-14', 899.97, 3),
    ('2024-01-13', 1449.98, 7);

-- Grant permissions
GRANT USAGE ON SCHEMA analytics TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO postgres;
