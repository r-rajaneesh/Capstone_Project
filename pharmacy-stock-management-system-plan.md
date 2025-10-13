# Pharmacy Stock Management System

## Architecture Overview

- **Backend**: Bun + SQLite database
- **Frontend**: Astro with Bun runtime
- **Native Extensions**: C and C++ programs for MD5 file hashing
- **File Storage**: Dedicated directory for uploaded inventory files

## Database Schema (SQLite)

### Tables to create:

- `medicines` - id, name, description, generic_name, dosage_form, strength, manufacturer
- `batches` - id, medicine_id, batch_number, quantity, cost_price, selling_price, manufacturing_date, expiry_date, supplier_id
- `suppliers` - id, name, contact_person, phone, email, address
- `purchase_orders` - id, supplier_id, order_date, expected_delivery, status, total_amount
- `purchase_order_items` - id, order_id, medicine_id, quantity, unit_price
- `sales` - id, sale_date, customer_name, customer_phone, total_amount, payment_method
- `sale_items` - id, sale_id, batch_id, quantity, unit_price, subtotal
- `inventory_uploads` - id, filename, file_hash, upload_date, file_path, format, processed_by

## Implementation Steps

### 1. Backend Setup (`/backend`)

- Initialize Bun project with TypeScript
- Setup SQLite database with better-sqlite3
- Create database schema and migrations
- Build REST API endpoints:
  - Medicines CRUD (`/api/medicines`)
  - Batches management (`/api/batches`)
  - Suppliers CRUD (`/api/suppliers`)
  - Purchase orders (`/api/purchase-orders`)
  - Sales transactions (`/api/sales`)
  - Low stock alerts (`/api/alerts/low-stock`)
  - Expiring items (`/api/alerts/expiring`)
  - Dashboard stats (`/api/dashboard`)
  - File upload with hash check (`/api/upload/csv`, `/api/upload/json`)

### 2. C File Hasher (`/backend/native/c-hasher`)

- `hash.c` - MD5 implementation using OpenSSL
- `main.c` - File reading and hash computation
- Compile to executable binary
- Create wrapper endpoint `/api/hash/c` that executes the C binary

### 3. C++ File Hasher (`/backend/native/cpp-hasher`)

- `hash.cpp` - MD5 implementation using OpenSSL
- `main.cpp` - File reading with C++ streams
- Compile to executable binary
- Create wrapper endpoint `/api/hash/cpp` that executes the C++ binary

### 4. File Upload Logic

- Save uploaded files to `/backend/uploads` directory
- Before saving, call both C and C++ hash endpoints
- Check `inventory_uploads` table for matching hash
- If duplicate found, reject with error message
- If unique, save file and hash to database
- Parse CSV/JSON and insert/update inventory data

### 5. Frontend Setup (`/frontend`)

- Initialize Astro project with Bun
- Install dependencies: @astrojs/react, chart.js, date-fns
- Create pages:
  - `/` - Dashboard (stats cards, charts, alerts)
  - `/medicines` - Medicine list with search/filter
  - `/batches` - Batch management
  - `/suppliers` - Supplier management
  - `/purchase-orders` - PO creation and tracking
  - `/sales` - Sales recording and history
  - `/upload` - File upload interface with format selection
  - `/reports` - Analytics and reports
- Create React components for forms, tables, modals
- Implement API integration using fetch

### 6. Key Features

- **Dashboard**: Total medicines, low stock count, expiring soon, recent sales
- **Low Stock Alerts**: Configurable threshold, visual indicators
- **Expiry Tracking**: Highlight items expiring within 30/60/90 days
- **Batch Management**: Track multiple batches per medicine with different prices
- **Sales Recording**: Select medicines, quantities, calculate totals
- **Purchase Orders**: Create POs, track status (pending, received, cancelled)
- **File Upload**: Drag-drop CSV/JSON, duplicate detection via C/C++ hashing
- **Reports**: Sales by period, inventory valuation, supplier performance

### 7. File Format Support

- **CSV**: columns - medicine_name, batch_number, quantity, cost_price, selling_price, expiry_date, supplier_name
- **JSON**: array of objects with same fields
- Parser validates and creates/updates medicines, batches, suppliers

## File Structure

```
/backend
  /src
    /db - schema.ts, migrations.ts
    /routes - API endpoints
    /services - business logic
    /utils - helpers
  /native
    /c-hasher - C implementation
    /cpp-hasher - C++ implementation
  /uploads - uploaded files storage
  package.json
  tsconfig.json

/frontend
  /src
    /pages - Astro pages
    /components - React components
    /layouts - page layouts
    /utils - API client
  package.json
  astro.config.mjs
```

## Technology Stack

- Runtime: Bun
- Database: SQLite with better-sqlite3
- Backend: TypeScript, Bun HTTP server
- Frontend: Astro, React, TailwindCSS
- Native: C/C++ with OpenSSL for MD5
- Charts: Chart.js or Recharts

## Documentation

Keep a changelog.md file at the root of the project and write all the changes that has been done or created or deleted or updated or fixed or improved or any other changes that has been done.

Add and log all errors that were discovered or found or predicted and fixes that were used to resolve the errors in the project in the errors.md file at the project root.
