# Dynamic File Upload System - Setup Guide

## Overview
Your Business Forecasting application has been upgraded from hard-coded mock data to a **dynamic file upload system**. You can now upload CSV files and the application will automatically use that data to populate all dashboards and analytics.

## Key Features

### ✅ What's New
1. **CSV File Upload** - Upload CSV files from the Admin Panel
2. **Automatic Data Processing** - Uploaded data is automatically detected and processed
3. **Dynamic Dashboards** - All pages now use uploaded data instead of hard-coded values:
   - Dashboard (forecast trends, segments)
   - Analytics (forecast trends, insights)
   - Models (metrics, feature importance)
    - RFMQ (customer segments)
   - Forecast (predictions based on real data)
4. **File Management** - View, preview, and delete uploaded files
5. **Fallback Support** - If no files are uploaded, the app falls back gracefully to API endpoints or mock data

## How to Use

### Step 1: Access the Admin Panel
1. Navigate to the **Admin Panel** from the main menu
2. You'll see a new **"Upload Data"** section at the top

### Step 2: Upload CSV Files
1. Click the upload area or drag and drop a CSV file
2. The file must be in CSV format (.csv extension)
3. The system automatically reads the file and extracts:
   - Column names
   - Data types
   - Number of rows
   - File metadata

### Step 3: View Uploaded Files
1. Below the upload section, you'll see **"Uploaded Files"** list
2. View details like:
   - File name
   - Number of columns
   - File size
   - Upload date
3. Delete files you no longer need

### Step 4: Data Appears Automatically
Once a file is uploaded, all pages automatically detect and use the data:
- **Dashboard** - Shows trends and segments from your data
- **Analytics** - Displays analytics based on uploaded data
- **Models** - Extracts metrics and feature importance
- **RFMQ** - Performs customer segmentation
- **Forecast** - Generates predictions

## Data Format Requirements

### Supported CSV Columns
The system intelligently detects and maps common column names:

#### For Forecasting:
- Date columns: `date`, `month`, `week`, `period`
- Value columns: `value`, `sales`, `forecast`, `actual`, `predicted`
- Example: `date,actual,forecast,value`

#### For Customer Segmentation (RFMQ):
- Customer ID: `customer`, `customer_id`, `customer_code`, `name`
- Recency: `recency`, `days_since_last_order`, `last_purchase_date`
- Frequency: `frequency`, `order_count`, `purchase_count`
- Monetary: `monetary`, `total_spent`, `revenue`, `total_value`
- Quantity: `quantity`, `total_items`, `item_count`
- Segment: `segment`, `category`, `tier`
- Example: `name,recency,frequency,monetary,quantity,segment`

#### For Model Metrics:
- Metric columns: `rmse`, `mae`, `mape`, `r2`, `accuracy`, `precision`, `recall`, `f1`
- Example: `rmse,mae,mape,r2`

#### For Feature Importance:
- Feature name: `feature`, `name`, `column_name`
- Importance score: `importance`, `score`, `weight`
- Example: `feature,importance`

## Sample CSV Files

### Forecast Data
```csv
month,actual,forecast
2026-01-01,82000,81500
2026-02-01,91000,90000
2026-03-01,88000,89500
2026-04-01,102000,100000
```

### Customer Segmentation Data
```csv
name,recency,frequency,monetary,quantity,segment
Alice Johnson,5,45,12500,180,Champions
Bob Smith,12,32,8900,124,Loyal
Carol White,45,8,2400,32,At Risk
David Brown,3,52,18700,245,Champions
```

### Model Metrics
```csv
rmse,mae,mape,r2
1250.5,980.3,8.2,0.94
```

### Feature Importance
```csv
feature,importance
Historical Sales,0.42
Seasonality,0.28
Customer Frequency,0.18
Market Trend,0.12
```

## File Storage

Files are stored in the `uploads/` directory:
- **Location**: `./uploads/`
- **Index**: `./uploads/data_index.json` (metadata)
- Files are saved with clean filenames

## Data Processing Flow

```
Upload CSV
    ↓
System validates file
    ↓
Parse CSV to DataFrame
    ↓
Extract metadata
    ↓
Store file & create index
    ↓
Pages fetch combined data
    ↓
Data transformers process it
    ↓
Dashboards update automatically
```

## API Endpoints

### Upload Management
- **POST** `/api/v1/uploads/upload` - Upload a CSV file
- **GET** `/api/v1/uploads/files` - List all uploaded files
- **GET** `/api/v1/uploads/files/{filename}/preview` - Preview file data
- **DELETE** `/api/v1/uploads/files/{filename}` - Delete a file
- **GET** `/api/v1/uploads/data` - Get combined data from all files

## Troubleshooting

### Issue: "Only CSV files are allowed"
**Solution**: Make sure your file has the `.csv` extension

### Issue: "Failed to parse CSV file"
**Solution**: Ensure your CSV is properly formatted
- Check for consistent delimiters
- Verify column headers
- Remove any special characters that might cause parsing issues

### Issue: Data not appearing in dashboards
**Solution**: 
1. Ensure columns are named according to the supported formats
2. Check that data types are correct (numeric columns should have numbers)
3. Try uploading a sample file first to test
4. Check browser console for any error messages

### Issue: "No uploaded files available"
**Solution**: You haven't uploaded any files yet. The app will show mock data as fallback.

## Advanced Usage

### Multiple Files
You can upload multiple CSV files. The system will:
1. Combine all active files
2. Use the combined dataset for analysis
3. Remove duplicates intelligently

### Data Refresh
The dashboards automatically refresh when you:
1. Upload a new file
2. Delete a file
3. Reload the page

### Combining Different Data Sources
You can upload multiple files with different data:
- One file with sales forecasts
- Another with customer data
- The system will intelligently combine them

## Best Practices

1. **Use Consistent Column Names** - Use standard names like `date`, `sales`, `customer`, etc.
2. **Ensure Data Quality** - Clean your CSV before uploading
3. **Named Rows** - Include header row with column names
4. **Numeric Data** - Use numbers without currency symbols for numeric columns
5. **Date Format** - Use ISO format (YYYY-MM-DD) or common formats
6. **No Empty Columns** - Remove unnecessary columns to improve processing

## Architecture

### Backend (Python/FastAPI)
- **Location**: `backend/app/services/data_storage_service.py`
- **Endpoints**: `backend/app/api/v1/endpoints/uploads.py`
- Handles file validation, storage, and data extraction

### Frontend (React/TypeScript)
- **API Client**: `src/app/services/api/client.ts`
- **Component**: `src/app/components/shared/FileUploadComponent.tsx`
- **Utilities**: `src/app/utils/dataProcessing.ts`
- **Pages**: All pages updated to fetch and use uploaded data

## Migration from Mock Data

### For Developers
The system maintains backward compatibility:
1. If no files are uploaded → uses mock data
2. If files are uploaded → uses file data
3. If API errors → falls back to mock data

This means your application will continue to work even if upload endpoints aren't available.

## Future Enhancements

Potential improvements:
1. Database storage for uploaded files
2. File versioning and history
3. Data schema validation
4. CSV preview before upload confirmation
5. Bulk file upload
6. Export processed data
7. Data transformation rules
8. Scheduled uploads via API

---

**For questions or issues**, check the application logs and browser console for detailed error messages.
