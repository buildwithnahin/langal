# Field Data Collection Feature - Implementation Summary

## Overview
এই ফিচারটি Data Operator দের জন্য মাঠ পর্যায়ের তথ্য সংগ্রহ করার জন্য তৈরি করা হয়েছে। এতে আবহাওয়া, ফসল, মাটি এবং কৃষি সংক্রান্ত বিভিন্ন তথ্য সংরক্ষণ করা যায়।

## Features Implemented

### 1. Database Schema
**Table: `field_data_reports`**
- `report_id` (Primary Key)
- `data_operator_id` (Foreign Key to users.user_id)
- `postal_code` (Foreign Key to location.postal_code)
- `village` (VARCHAR 100) - গ্রামের নাম
- `weather_condition` (VARCHAR 50) - আবহাওয়ার অবস্থা (sunny/cloudy/rainy/stormy)
- `temperature` (DECIMAL 5,2) - তাপমাত্রা
- `rainfall` (DECIMAL 5,2) - বৃষ্টিপাত
- `crop_condition` (TEXT) - ফসলের অবস্থা
- `pest_disease` (TEXT) - পোকামাকড়/রোগবালাই
- `soil_moisture` (VARCHAR 50) - মাটির আর্দ্রতা
- `irrigation_status` (VARCHAR 50) - সেচের অবস্থা
- `notes` (TEXT) - অতিরিক্ত মন্তব্য
- `report_date` (DATE) - রিপোর্টের তারিখ
- `created_at`, `updated_at`

**Indexes:**
- `idx_data_operator` on `data_operator_id`
- `idx_report_date` on `report_date`

### 2. Backend API Endpoints

**Base URL:** `/api/data-operator/field-reports`

#### GET `/api/data-operator/field-reports`
- **Purpose:** Get all field reports for logged-in data operator
- **Auth:** Required (Sanctum token)
- **Authorization:** Only users with `user_type = 'data_operator'`
- **Response:** List of reports with location information (division, district, upazila, post office in Bangla)

#### POST `/api/data-operator/field-reports`
- **Purpose:** Create a new field report
- **Auth:** Required (Sanctum token)
- **Authorization:** Only data operators
- **Validation:**
  - `village`: required, string, max 100
  - `postal_code`: nullable, integer, exists in location table
  - `weather_condition`: required, string, max 50
  - `temperature`: nullable, numeric
  - `rainfall`: nullable, numeric
  - `crop_condition`: nullable, string
  - `pest_disease`: nullable, string
  - `soil_moisture`: nullable, string, max 50
  - `irrigation_status`: nullable, string, max 50
  - `notes`: nullable, string
  - `report_date`: required, date

#### DELETE `/api/data-operator/field-reports/{reportId}`
- **Purpose:** Delete a field report
- **Auth:** Required
- **Authorization:** Only the data operator who created the report
- **Response:** Success message

### 3. Frontend Components

#### Main Component: `FieldDataCollection.tsx`
**Location:** `src/components/data-operator/FieldDataCollection.tsx`

**Features:**
1. **LocationSelector Integration**
   - Uses existing LocationSelector component
   - Shows division, district, upazila, post office
   - Stores postal_code for report

2. **Village Input**
   - Required field for village name in Bangla
   - Text input field

3. **Weather Data**
   - Weather condition dropdown: ☀️ রৌদ্রজ্জ্বল, ☁️ মেঘলা, 🌧️ বৃষ্টি, ⛈️ ঝড়
   - Temperature input (°C)
   - Rainfall input (mm)

4. **Soil Data**
   - Soil moisture dropdown: শুষ্ক, মাঝারি, ভেজা
   - Irrigation status dropdown: ভালো, মাঝারি, খারাপ

5. **Crop Data**
   - Crop condition textarea
   - Pest/disease textarea
   - Additional notes textarea

6. **Report Date**
   - Date picker (defaults to today)

7. **Reports List**
   - Card-based grid layout
   - Shows village name, location, weather icon, temperature, rainfall
   - View details dialog
   - Delete button
   - Color-coded weather badges

8. **Statistics Cards**
   - Total reports count
   - Today's reports count
   - Number of unique areas covered

**Theme:** Orange gradient background matching the dashboard card

### 4. Page Component: `DataOperatorFieldData.tsx`
**Location:** `src/pages/DataOperatorFieldData.tsx`
- Wrapper page component
- Includes navigation back to dashboard
- Renders FieldDataCollection component

### 5. Routes

**Frontend Route:**
```typescript
/data-operator/field-data → DataOperatorFieldData component
```

**Backend Routes:**
```php
GET    /api/data-operator/field-reports
POST   /api/data-operator/field-reports
DELETE /api/data-operator/field-reports/{reportId}
```

### 6. Models Created

**FieldDataReport.php**
- Primary key: `report_id`
- Relationships:
  - `dataOperator()` - belongsTo User
  - `location()` - belongsTo Location

**Location.php**
- Primary key: `postal_code`
- No timestamps
- Relationship: `fieldReports()` - hasMany FieldDataReport

## Dashboard Integration

The feature is accessible from the Data Operator Dashboard as the **2nd card**:

```
Card Title: মাঠ পর্যায়ের তথ্য
Description: আবহাওয়া ও কৃষি তথ্য সংগ্রহ ও পরিচালনা
Icon: CloudSun
Color: Orange gradient (from-orange-500 to-orange-600)
Route: /data-operator/field-data
```

## Security Features

1. **User Type Verification:** All API endpoints check `user_type === 'data_operator'`
2. **Ownership Verification:** Deletion only allowed for reports created by the logged-in data operator
3. **Authentication Required:** All endpoints protected by Sanctum middleware
4. **403 Response:** Returns 403 Forbidden if user type is incorrect

## Validation Rules

- **Village name:** Required
- **Weather condition:** Required (must select from dropdown)
- **Postal code:** Optional, but if provided must exist in location table
- **Temperature/Rainfall:** Optional, numeric
- **Report date:** Required, must be a valid date
- **All text fields:** Optional except village and weather_condition

## Testing Checklist

✅ Database table created with all columns and indexes
✅ Backend API routes registered and verified
✅ Models created with proper relationships
✅ Frontend component with LocationSelector integration
✅ Form validation on frontend
✅ Reports listing with cards and badges
✅ View details dialog
✅ Delete functionality
✅ Statistics cards
✅ Route integrated in App.tsx
✅ Dashboard card configured

## Next Steps

To use this feature:

1. **Start Backend:**
   ```bash
   cd langal-backend
   php artisan serve
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Login as Data Operator:**
   - Go to `/data-operator`
   - Login with data operator credentials

4. **Access Field Data Collection:**
   - Click on "মাঠ পর্যায়ের তথ্য" card (orange card, 2nd position)
   - Click "নতুন রিপোর্ট" to create a new report
   - Select location using LocationSelector
   - Enter village name
   - Fill in weather and agricultural data
   - Submit to save

5. **View Reports:**
   - All saved reports appear in grid layout
   - Click "বিস্তারিত" to view full details
   - Click trash icon to delete a report

## Files Modified/Created

**Backend:**
- ✅ `app/Http/Controllers/Api/DataOperatorAuthController.php` - Added 3 methods
- ✅ `routes/api.php` - Added 3 routes
- ✅ `app/Models/FieldDataReport.php` - Created new model
- ✅ `app/Models/Location.php` - Created new model

**Frontend:**
- ✅ `src/components/data-operator/FieldDataCollection.tsx` - Created main component
- ✅ `src/pages/DataOperatorFieldData.tsx` - Already existed, uses new component

**Database:**
- ✅ `field_data_reports` table created via Tinker

## API Response Examples

**GET /api/data-operator/field-reports**
```json
{
  "success": true,
  "data": [
    {
      "report_id": 1,
      "postal_code": 1216,
      "village": "রামপুর",
      "weather_condition": "sunny",
      "temperature": 28.5,
      "rainfall": 0,
      "crop_condition": "ধান ভালো অবস্থায় আছে",
      "pest_disease": "কোন সমস্যা নেই",
      "soil_moisture": "moderate",
      "irrigation_status": "good",
      "notes": "সব ঠিক আছে",
      "report_date": "2024-01-15",
      "location_info": {
        "division_bn": "ঢাকা",
        "district_bn": "ঢাকা",
        "upazila_bn": "সাভার",
        "post_office_bn": "সাভার"
      }
    }
  ]
}
```

**POST /api/data-operator/field-reports**
```json
{
  "success": true,
  "message": "Field report created successfully",
  "data": {
    "report_id": 2
  }
}
```

## Conclusion

The Field Data Collection feature is now fully implemented and ready to use. It provides a comprehensive interface for data operators to collect, view, and manage field-level agricultural and weather data with proper location tracking using the LocationSelector component and village name input.
