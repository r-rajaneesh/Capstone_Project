# Pharmacy Stock Management System

A comprehensive pharmacy inventory management system built with Bun, Astro, React, and SQLite, featuring C/C++ file hashing for duplicate detection.

## Features

### Core Functionality

- **Medicine Management**: CRUD operations for medicines with detailed information
- **Batch Tracking**: Track multiple batches per medicine with expiry dates and pricing
- **Supplier Management**: Manage supplier information and relationships
- **Purchase Orders**: Create and track purchase orders with status management
- **Sales Recording**: Record sales transactions with customer information
- **Inventory Alerts**: Low stock and expiring item notifications
- **Dashboard**: Real-time overview of inventory and operations

### Advanced Features

- **File Upload**: Bulk import via CSV/JSON with duplicate detection
- **MD5 Hashing**: C and C++ programs for file integrity verification
- **Duplicate Prevention**: Automatic detection and rejection of duplicate files
- **Reports & Analytics**: Sales reports, inventory valuation, and performance metrics

## Technology Stack

### Backend

- **Runtime**: Bun with TypeScript
- **Database**: SQLite with sqlite3 driver
- **Framework**: Hono for REST API
- **Native Extensions**: C and C++ for MD5 file hashing

### Frontend

- **Framework**: Astro with React components
- **Styling**: TailwindCSS
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React

## Project Structure

```
pharmacy-stock-management-system/
├── backend/
│   ├── src/
│   │   ├── db/              # Database schema and connection
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helper functions
│   ├── native/
│   │   ├── c-hasher/        # C MD5 hashing program
│   │   └── cpp-hasher/      # C++ MD5 hashing program
│   ├── bin/                 # Compiled native binaries
│   ├── uploads/             # File upload storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # Astro pages
│   │   ├── components/      # React components
│   │   ├── layouts/         # Page layouts
│   │   └── utils/           # API client and utilities
│   └── package.json
└── README.md
```

## Database Schema

### Tables

- `medicines` - Medicine master data
- `batches` - Batch information with quantities and pricing
- `suppliers` - Supplier information
- `purchase_orders` - Purchase order headers
- `purchase_order_items` - Purchase order line items
- `sales` - Sales transaction headers
- `sale_items` - Sales transaction line items
- `inventory_uploads` - File upload tracking with hashes

## Installation

### Prerequisites

- Bun runtime
- GCC/G++ compiler with OpenSSL development libraries
- Make

### Backend Setup

```bash
cd backend

# Install dependencies
bun install

# Compile native hashing programs
cd native/c-hasher && make && make install
cd ../cpp-hasher && make && make install

# Start development server
bun run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
bun install

# Start development server
bun run dev
```

## API Endpoints

### Medicines

- `GET /api/medicines` - List medicines with search and pagination
- `GET /api/medicines/:id` - Get medicine details with batches
- `POST /api/medicines` - Create new medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

### Batches

- `GET /api/batches` - List batches with filters
- `GET /api/batches/:id` - Get batch details
- `POST /api/batches` - Create new batch
- `PUT /api/batches/:id` - Update batch
- `PATCH /api/batches/:id/quantity` - Update batch quantity
- `DELETE /api/batches/:id` - Delete batch

### Suppliers

- `GET /api/suppliers` - List suppliers
- `GET /api/suppliers/:id` - Get supplier details
- `POST /api/suppliers` - Create new supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Purchase Orders

- `GET /api/purchase-orders` - List purchase orders
- `GET /api/purchase-orders/:id` - Get purchase order details
- `POST /api/purchase-orders` - Create new purchase order
- `PATCH /api/purchase-orders/:id/status` - Update order status
- `DELETE /api/purchase-orders/:id` - Delete purchase order

### Sales

- `GET /api/sales` - List sales with date filters
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales` - Create new sale
- `GET /api/sales/stats/summary` - Get sales statistics
- `GET /api/sales/stats/top-medicines` - Get top selling medicines

### File Upload

- `POST /api/upload/csv` - Upload CSV file
- `POST /api/upload/json` - Upload JSON file
- `GET /api/upload/history` - Get upload history

### Hash Verification

- `POST /api/hash/c` - Compute MD5 hash using C program
- `POST /api/hash/cpp` - Compute MD5 hash using C++ program
- `POST /api/hash/compare` - Compare hashes from both programs
- `GET /api/hash/health` - Check hash program health

### Dashboard

- `GET /api/dashboard` - Get dashboard statistics
- `GET /api/dashboard/alerts/low-stock` - Get low stock alerts
- `GET /api/dashboard/alerts/expiring` - Get expiring items
- `GET /api/dashboard/recent-sales` - Get recent sales
- `GET /api/dashboard/recent-purchases` - Get recent purchases
- `GET /api/dashboard/charts/sales` - Get sales chart data
- `GET /api/dashboard/charts/inventory` - Get inventory chart data

## File Upload Format

### CSV Format

```csv
medicine_name,batch_number,quantity,cost_price,selling_price,expiry_date,supplier_name,description,generic_name,dosage_form,strength,manufacturer
Paracetamol 500mg,PAR001,1000,0.50,1.00,2026-01-01,MediCorp Pharmaceuticals,Pain reliever,Acetaminophen,Tablet,500mg,MediCorp Pharmaceuticals
```

### JSON Format

```json
[
	{
		"medicine_name": "Paracetamol 500mg",
		"batch_number": "PAR001",
		"quantity": 1000,
		"cost_price": 0.5,
		"selling_price": 1.0,
		"expiry_date": "2026-01-01",
		"supplier_name": "MediCorp Pharmaceuticals",
		"description": "Pain reliever",
		"generic_name": "Acetaminophen",
		"dosage_form": "Tablet",
		"strength": "500mg",
		"manufacturer": "MediCorp Pharmaceuticals"
	}
]
```

## Development

### Running the Application

1. Start the backend server: `cd backend && bun run dev`
2. Start the frontend server: `cd frontend && bun run dev`
3. Access the application at `http://localhost:4321`

### Building for Production

```bash
# Backend
cd backend && bun run build

# Frontend
cd frontend && bun run build
```

## Security Features

### File Duplicate Detection

- Each uploaded file is hashed using MD5 algorithm
- Both C and C++ programs compute the same hash
- Hashes are compared to ensure integrity
- Duplicate files are automatically rejected
- Upload history tracks all file hashes

### Data Validation

- Input validation on all API endpoints
- File format validation for uploads
- Database constraints and foreign keys
- Error handling and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
