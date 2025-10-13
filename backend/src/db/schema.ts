export const CREATE_TABLES = `
-- Medicines table
CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    generic_name TEXT,
    dosage_form TEXT,
    strength TEXT,
    manufacturer TEXT,
    initial_stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_id INTEGER NOT NULL,
    batch_number TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    cost_price REAL NOT NULL,
    selling_price REAL NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE,
    supplier_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    UNIQUE(medicine_id, batch_number)
);

-- Purchase Orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery DATE,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'received', 'cancelled')),
    total_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- Purchase Order Items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    medicine_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    customer_name TEXT,
    customer_phone TEXT,
    total_amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'card', 'upi')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sale Items table
CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    batch_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- Inventory Uploads table
CREATE TABLE IF NOT EXISTS inventory_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    file_hash TEXT NOT NULL UNIQUE,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT NOT NULL,
    format TEXT NOT NULL CHECK(format IN ('csv', 'json')),
    processed_by TEXT DEFAULT 'system',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_batches_medicine_id ON batches(medicine_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_uploads_hash ON inventory_uploads(file_hash);
`;

export const INSERT_SAMPLE_DATA = `
-- Insert sample suppliers
INSERT OR IGNORE INTO suppliers (name, contact_person, phone, email, address) VALUES
('MediCorp Pharmaceuticals', 'John Smith', '+1-555-0123', 'john@medicorp.com', '123 Pharma St, City'),
('HealthPlus Distributors', 'Sarah Johnson', '+1-555-0456', 'sarah@healthplus.com', '456 Medical Ave, City'),
('Global Medicine Co', 'Mike Wilson', '+1-555-0789', 'mike@globalmed.com', '789 Healthcare Blvd, City');

-- Insert sample medicines
INSERT OR IGNORE INTO medicines (name, description, generic_name, dosage_form, strength, manufacturer) VALUES
('Paracetamol 500mg', 'Pain reliever and fever reducer', 'Acetaminophen', 'Tablet', '500mg', 'MediCorp Pharmaceuticals'),
('Ibuprofen 400mg', 'Anti-inflammatory pain reliever', 'Ibuprofen', 'Tablet', '400mg', 'HealthPlus Distributors'),
('Amoxicillin 250mg', 'Antibiotic for bacterial infections', 'Amoxicillin', 'Capsule', '250mg', 'Global Medicine Co'),
('Omeprazole 20mg', 'Proton pump inhibitor for acid reflux', 'Omeprazole', 'Capsule', '20mg', 'MediCorp Pharmaceuticals'),
('Metformin 500mg', 'Diabetes medication', 'Metformin', 'Tablet', '500mg', 'HealthPlus Distributors');

-- Insert sample batches
INSERT OR IGNORE INTO batches (medicine_id, batch_number, quantity, cost_price, selling_price, manufacturing_date, expiry_date, supplier_id) VALUES
(1, 'PAR001', 1000, 0.50, 1.00, '2024-01-01', '2026-01-01', 1),
(1, 'PAR002', 800, 0.52, 1.05, '2024-02-01', '2026-02-01', 1),
(2, 'IBU001', 500, 0.80, 1.50, '2024-01-15', '2026-01-15', 2),
(3, 'AMO001', 300, 2.00, 4.00, '2024-01-10', '2025-07-10', 3),
(4, 'OME001', 200, 1.50, 3.00, '2024-02-01', '2026-02-01', 1),
(5, 'MET001', 150, 1.20, 2.50, '2024-01-20', '2026-01-20', 2);
`;
