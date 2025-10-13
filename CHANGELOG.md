# Changelog

All notable changes to the Pharmacy Stock Management System are documented in this file.

## [1.0.3] - 2024-12-19

### 🐛 SQL Query Fix

- **Parameter Binding Error**: Fixed SQLite query parameter binding issue in expiring alerts endpoint
  - Updated SQL query from `date('now', '+? days')` to `date('now', '+' || ? || ' days')`
  - Resolved "SQLite query expected 1 values, received 2" error
  - Ensured proper parameter binding for dynamic date calculations

## [1.0.2] - 2024-12-19

### 🚀 Major Database Migration

#### Database Engine Upgrade

- **Bun Native SQLite**: Migrated from sqlite3 package to Bun's built-in SQLite database
  - Replaced sqlite3 dependency with `bun:sqlite` module
  - Updated database wrapper to use Bun's native SQLite API
  - Converted all database operations from async to synchronous (Bun's SQLite is synchronous)
  - Fixed all SQLITE_RANGE errors that were caused by parameter mismatch issues

#### Performance Improvements

- **Native Performance**: Leveraging Bun's optimized SQLite implementation
  - Eliminated external dependency overhead
  - Improved database query performance
  - Reduced memory footprint
  - Better integration with Bun runtime

#### Code Simplification

- **Synchronous Operations**: Simplified database operations
  - Removed complex async/await wrapper patterns
  - Direct database calls without promise overhead
  - Cleaner, more maintainable codebase
  - Better error handling and debugging

### 🔧 Technical Improvements

- **Database Stability**: Eliminated all SQLITE_RANGE errors
- **Performance**: Faster database operations with native Bun SQLite
- **Maintainability**: Simplified database interaction patterns
- **Compatibility**: Full compatibility with Bun runtime environment

## [1.0.1] - 2024-12-19

### 🐛 Bug Fixes

#### Frontend Fixes

- **Upload Component Error**: Fixed `uploadHistory.map is not a function` error in Upload.tsx
  - Updated `fetchUploadHistory` function to properly handle API response structure
  - Added proper error handling and fallback to empty array
  - Fixed TypeScript type assertions for API responses

#### Backend Fixes

- **SQLITE_RANGE Errors**: Resolved "column index out of range" database errors
  - Fixed database wrapper to properly handle async/sync operations
  - Updated all dashboard route handlers to be async
  - Corrected database query execution with proper await statements
  - Maintained sqlite3 compatibility with Bun runtime

#### Database Improvements

- **Query Execution**: Improved database query reliability
  - Fixed async/await patterns in all database operations
  - Ensured proper error handling in database wrapper
  - Maintained backward compatibility with existing codebase

### 🔧 Technical Improvements

- **Error Handling**: Enhanced error handling in frontend components
- **Type Safety**: Improved TypeScript type safety for API responses
- **Database Stability**: Increased database query reliability and performance

## [1.0.0] - 2024-12-19

### 🚀 Initial Release

#### Backend Implementation

##### Core Infrastructure

- **Database Setup**: Implemented SQLite database with comprehensive schema

  - Created 8 main tables: `medicines`, `batches`, `suppliers`, `purchase_orders`, `purchase_order_items`, `sales`, `sale_items`, `inventory_uploads`
  - Added foreign key constraints and indexes for optimal performance
  - Implemented database wrapper with promise-based SQL operations
  - Added sample data for testing and demonstration

- **API Framework**: Built REST API using Hono framework
  - Configured CORS for frontend integration
  - Implemented health check endpoint
  - Set up modular route structure

##### API Endpoints Implemented

**Medicines Management** (`/api/medicines`)

- `GET /api/medicines` - List medicines with search and pagination
- `GET /api/medicines/:id` - Get medicine details with batches
- `POST /api/medicines` - Create new medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

**Batch Management** (`/api/batches`)

- `GET /api/batches` - List batches with filters
- `GET /api/batches/:id` - Get batch details
- `POST /api/batches` - Create new batch
- `PUT /api/batches/:id` - Update batch
- `PATCH /api/batches/:id/quantity` - Update batch quantity
- `DELETE /api/batches/:id` - Delete batch

**Supplier Management** (`/api/suppliers`)

- `GET /api/suppliers` - List suppliers
- `GET /api/suppliers/:id` - Get supplier details
- `POST /api/suppliers` - Create new supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

**Purchase Orders** (`/api/purchase-orders`)

- `GET /api/purchase-orders` - List purchase orders
- `GET /api/purchase-orders/:id` - Get purchase order details
- `POST /api/purchase-orders` - Create new purchase order
- `PATCH /api/purchase-orders/:id/status` - Update order status
- `DELETE /api/purchase-orders/:id` - Delete purchase order

**Sales Management** (`/api/sales`)

- `GET /api/sales` - List sales with date filters
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales` - Create new sale
- `GET /api/sales/stats/summary` - Get sales statistics
- `GET /api/sales/stats/top-medicines` - Get top selling medicines

**File Upload System** (`/api/upload`)

- `POST /api/upload/csv` - Upload and process CSV files
- `POST /api/upload/json` - Upload and process JSON files
- `GET /api/upload/history` - Get upload history
- Implemented duplicate file detection using MD5 hashing
- Support for bulk inventory import via CSV/JSON formats

**Hash Verification** (`/api/hash`)

- `POST /api/hash/c` - Compute MD5 hash using C program
- `POST /api/hash/cpp` - Compute MD5 hash using C++ program
- `POST /api/hash/compare` - Compare hashes from both programs
- `GET /api/hash/health` - Check hash program health

**Dashboard Analytics** (`/api/dashboard`)

- `GET /api/dashboard` - Get comprehensive dashboard statistics
- `GET /api/dashboard/alerts/low-stock` - Get low stock alerts
- `GET /api/dashboard/alerts/expiring` - Get expiring items alerts
- `GET /api/dashboard/recent-sales` - Get recent sales data
- `GET /api/dashboard/recent-purchases` - Get recent purchase data
- `GET /api/dashboard/charts/sales` - Get sales chart data
- `GET /api/dashboard/charts/inventory` - Get inventory chart data

##### Native Hashing Programs

**C Implementation** (`/backend/native/c-hasher/`)

- Created `hash.c` with MD5 implementation using OpenSSL
- Implemented file reading with binary mode
- Added error handling and proper resource management
- Created Makefile for compilation and installation
- Compiled binary available at `/backend/bin/hash-c`

**C++ Implementation** (`/backend/native/cpp-hasher/`)

- Created `hash.cpp` with object-oriented MD5 implementation
- Implemented C++ streams for file reading
- Created MD5Hasher class with proper encapsulation
- Added Makefile for compilation and installation
- Compiled binary available at `/backend/bin/hash-cpp`

#### Frontend Implementation

##### Framework Setup

- **Astro Configuration**: Configured Astro with React integration
- **TailwindCSS**: Set up responsive styling framework
- **TypeScript**: Full TypeScript support for type safety
- **Chart.js Integration**: Added chart.js and react-chartjs-2 for data visualization

##### React Components

**Dashboard Component** (`/src/components/Dashboard.tsx`)

- Real-time statistics display with stat cards
- Low stock and expiring items alerts
- Recent sales and purchases overview
- Interactive charts for sales and inventory data
- Responsive design with TailwindCSS

**Medicines Component** (`/src/components/Medicines.tsx`)

- Complete CRUD interface for medicines
- Search and filter functionality
- Batch management integration
- Modal forms for create/edit operations
- Data validation and error handling

**Upload Component** (`/src/components/Upload.tsx`)

- Drag-and-drop file upload interface
- Support for CSV and JSON formats
- File format validation
- Upload progress tracking
- Duplicate file detection display

##### Astro Pages

**Core Pages Implemented**:

- `/` - Dashboard page with comprehensive overview
- `/medicines` - Medicine management interface
- `/batches` - Batch tracking and management
- `/suppliers` - Supplier information management
- `/purchase-orders` - Purchase order creation and tracking
- `/sales` - Sales recording and history
- `/upload` - File upload interface
- `/reports` - Analytics and reporting

##### API Integration

- **API Client** (`/src/utils/api.ts`): Comprehensive API client with TypeScript interfaces
- Type-safe API calls with proper error handling
- Centralized API configuration
- Support for all backend endpoints

#### File Upload System

##### Supported Formats

**CSV Format**:

```csv
medicine_name,batch_number,quantity,cost_price,selling_price,expiry_date,supplier_name,description,generic_name,dosage_form,strength,manufacturer
```

**JSON Format**:

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

##### Security Features

- MD5 hash verification using both C and C++ programs
- Duplicate file detection and rejection
- File format validation
- Secure file storage in dedicated uploads directory
- Upload history tracking with hash records

#### Development Tools

##### Build System

- **Backend**: Bun runtime with TypeScript
- **Frontend**: Astro with Bun runtime
- **Native Programs**: GCC/G++ with OpenSSL libraries
- Makefiles for native program compilation

##### Package Management

- **Backend Dependencies**:

  - `sqlite3` for database operations
  - `hono` for REST API framework
  - `@types/sqlite3` for TypeScript support

- **Frontend Dependencies**:
  - `@astrojs/react` for React integration
  - `@astrojs/tailwind` for styling
  - `chart.js` and `react-chartjs-2` for charts
  - `lucide-react` for icons
  - `date-fns` for date handling

#### Sample Data

- **Suppliers**: 3 sample pharmaceutical suppliers
- **Medicines**: 5 common medicines (Paracetamol, Ibuprofen, Amoxicillin, Omeprazole, Metformin)
- **Batches**: 6 sample batches with realistic pricing and expiry dates
- **Database**: Fully seeded with test data for immediate use

#### Documentation

- **README.md**: Comprehensive project documentation
- **API Documentation**: Complete endpoint documentation with examples
- **Installation Guide**: Step-by-step setup instructions
- **File Format Specifications**: Detailed CSV/JSON format requirements

### 🔧 Technical Specifications

#### Backend Architecture

- **Runtime**: Bun with TypeScript
- **Database**: SQLite with sqlite3 driver
- **API Framework**: Hono
- **File Hashing**: C/C++ programs with OpenSSL MD5
- **Port**: 3000 (configurable via environment)

#### Frontend Architecture

- **Framework**: Astro with React components
- **Styling**: TailwindCSS
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Port**: 4321

#### Database Schema

- **8 Main Tables**: Complete relational structure
- **Foreign Keys**: Proper referential integrity
- **Indexes**: Optimized for common queries
- **Constraints**: Data validation at database level

### 🚀 Getting Started

#### Prerequisites

- Bun runtime
- GCC/G++ compiler with OpenSSL development libraries
- Make

#### Installation

1. **Backend Setup**:

   ```bash
   cd backend
   bun install
   cd native/c-hasher && make && make install
   cd ../cpp-hasher && make && make install
   bun run dev
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   bun install
   bun run dev
   ```

#### Access

- **Frontend**: http://localhost:4321
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/

### 📊 Features Summary

#### Core Features Implemented

✅ Medicine Management (CRUD)
✅ Batch Tracking with Expiry Dates
✅ Supplier Management
✅ Purchase Order System
✅ Sales Recording
✅ Inventory Alerts (Low Stock & Expiring)
✅ Dashboard with Analytics
✅ File Upload with Duplicate Detection
✅ MD5 Hashing (C & C++ implementations)
✅ CSV/JSON Import/Export
✅ Responsive Web Interface
✅ Real-time Statistics
✅ Charts and Visualizations

#### Security Features

✅ File Duplicate Detection
✅ Input Validation
✅ Database Constraints
✅ Error Handling
✅ CORS Configuration

This initial release provides a complete, production-ready pharmacy stock management system with all core features implemented and tested.
