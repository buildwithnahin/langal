# Profile Verification Feature - Implementation Guide

## Overview
Implemented a complete Profile Verification feature for Data Operators to review, approve, or reject farmer profiles.

## Features Implemented

### Frontend Components

#### ProfileVerification Component (`src/components/data-operator/ProfileVerification.tsx`)

**Key Features:**
1. **Farmers List Display**
   - Table view with farmer information
   - Profile photo display
   - Mobile number
   - Location (Village, Upazila)
   - Verification status badges (Pending, Approved, Rejected)

2. **Statistics Dashboard**
   - Total farmers count
   - Pending verifications count
   - Approved farmers count

3. **View Profile Dialog**
   - Full profile information display
   - Profile photo (large view)
   - Personal information (Name, Phone, DOB, Gender, NID)
   - Address details (Division, District, Upazila, Union, Post Office, Village)
   - Status badge display

4. **Verification Actions**
   - **See Profile** button - View farmer details
   - **Approve** button - Approve farmer profile
   - **Reject** button - Reject farmer profile
   - Processing state during verification
   - Success/error toast notifications

5. **Status Indicators**
   - ✅ Approved - Green badge
   - ❌ Rejected - Red badge with alert message
   - ⏳ Pending - Yellow badge
   - Alert message for rejected profiles

6. **Navigation**
   - Back button to return to dashboard
   - Header with page title

### Backend Implementation

#### Controller Methods (`app/Http/Controllers/Api/DataOperatorAuthController.php`)

**1. getFarmers()**
- Endpoint: `GET /api/data-operator/farmers`
- Authentication: Required (Sanctum)
- Returns list of all farmers with:
  - User ID
  - Full name
  - Phone number
  - Profile photo URL (full path)
  - Date of birth
  - Gender
  - NID number
  - Location details (Division, District, Upazila, Union, Post Office, Village)
  - Verification status
  - Verified at timestamp
  - Verified by (Data Operator ID)

**2. verifyProfile()**
- Endpoint: `POST /api/data-operator/verify-profile`
- Authentication: Required (Sanctum)
- Request Body:
  ```json
  {
    "user_id": 123,
    "verification_status": "approved" // or "rejected"
  }
  ```
- Updates:
  - `verification_status` to approved/rejected
  - `verified_by` to current data operator's ID
  - `verified_at` to current timestamp
- Returns:
  - Success/error message
  - Updated verification details

#### Database Schema

**user_profiles Table - Verification Fields:**
```sql
verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
verified_by INT(11) NULL (Foreign key to users.id)
verified_at TIMESTAMP NULL
```

**Changes Made:**
- Updated enum values from 'verified' to 'approved'
- Existing 'verified' records converted to 'pending'

#### API Routes (`routes/api.php`)

```php
Route::prefix('data-operator')->middleware('auth:sanctum')->group(function () {
    Route::get('/farmers', [DataOperatorAuthController::class, 'getFarmers']);
    Route::post('/verify-profile', [DataOperatorAuthController::class, 'verifyProfile']);
});
```

### Model Updates

**UserProfile Model (`app/Models/UserProfile.php`)**
- Updated `isVerified()` method to check for 'approved' status
- Fillable fields include: verification_status, verified_by, verified_at
- Casts: verified_at as datetime

## User Flow

### Data Operator Workflow:

1. **Login**
   - Data operator logs in with mobile + password

2. **Dashboard**
   - Clicks on "প্রোফাইল যাচাই" (Profile Verification) feature card

3. **Profile Verification Page**
   - Views statistics:
     - Total farmers
     - Pending verifications
     - Approved farmers
   - Views list of all farmers in table format

4. **View Farmer Details**
   - Clicks "বিস্তারিত দেখুন" (See Details) button
   - Dialog opens showing:
     - Profile photo
     - Current status badge
     - Personal information
     - Address details

5. **Approve/Reject**
   - For pending profiles, buttons appear:
     - "অনুমোদন করুন" (Approve)
     - "প্রত্যাখ্যান করুন" (Reject)
   - Clicks appropriate button
   - Processing indicator shows
   - Success message displays
   - List updates automatically

6. **Rejected Profile Alert**
   - If profile is rejected, shows red alert box:
     - "আপনার প্রোফাইল প্রত্যাখ্যাত হয়েছে"
     - Message to contact office for correction

### Farmer Experience:

1. **Profile Status**
   - Farmer can view their verification status
   - Pending: Yellow badge
   - Approved: Green badge with checkmark
   - Rejected: Red badge with X, plus alert message

2. **Rejected Profile**
   - Sees prominent alert message
   - Instructed to contact office for profile correction
   - Cannot edit profile themselves

## Technical Details

### State Management
- `farmers`: Array of farmer profiles
- `loading`: Loading state for initial fetch
- `selectedFarmer`: Currently viewed farmer in dialog
- `isViewOpen`: Dialog open/close state
- `processingId`: User ID being processed (for disable state)

### API Integration
- Uses `api.get('/data-operator/farmers')` to fetch farmers
- Uses `api.post('/data-operator/verify-profile', {...})` for verification
- Toast notifications for success/error feedback

### Error Handling
- Try-catch blocks in backend
- Validation errors returned with 422 status
- User-friendly error messages in Bangla
- Console error logging for debugging

### UI Components Used
- Button (ShadcN UI)
- Dialog (ShadcN UI)
- Badge (ShadcN UI)
- Toast (Sonner)
- Icons (Lucide React): CheckCircle, XCircle, AlertCircle, ArrowLeft, Eye

## Testing

### Test Scenarios:

1. **View Farmers List**
   - Verify all farmers display correctly
   - Check profile photos load
   - Verify location data displays

2. **View Profile Details**
   - Click "বিস্তারিত দেখুন" button
   - Verify all information displays
   - Check profile photo in large view

3. **Approve Profile**
   - Select a pending profile
   - Click approve button
   - Verify success message
   - Check status updates to approved
   - Verify badge changes to green

4. **Reject Profile**
   - Select a pending profile
   - Click reject button
   - Verify success message
   - Check status updates to rejected
   - Verify badge changes to red
   - Verify alert message appears

5. **Already Verified**
   - View approved profile
   - Verify no approve/reject buttons show
   - View rejected profile
   - Verify alert message displays

## Files Modified

### Frontend
1. `src/components/data-operator/ProfileVerification.tsx` - Complete rewrite
2. Component integrated with existing dashboard

### Backend
1. `app/Http/Controllers/Api/DataOperatorAuthController.php` - Added getFarmers() and verifyProfile()
2. `routes/api.php` - Added new routes
3. `app/Models/UserProfile.php` - Updated isVerified() method

### Database
1. `user_profiles` table - Modified verification_status enum

## Next Steps / Future Enhancements

1. **Filtering**
   - Add tabs for Pending/Approved/Rejected
   - Search functionality by name/phone

2. **Pagination**
   - Implement pagination for large farmer lists

3. **Verification History**
   - Show who verified and when
   - Verification notes/comments

4. **Bulk Actions**
   - Select multiple profiles
   - Bulk approve/reject

5. **Notifications**
   - Notify farmers when approved/rejected
   - Email/SMS notifications

6. **Statistics**
   - Verification trends chart
   - Data operator performance metrics

## Running the Application

1. **Start Backend:**
   ```bash
   cd d:\SPL\langal\langal-backend
   php artisan serve
   ```

2. **Start Frontend:**
   ```bash
   cd d:\SPL\langal
   npm run dev
   ```

3. **Access Application:**
   - Frontend: http://localhost:5174
   - Backend: http://localhost:8000

4. **Login as Data Operator:**
   - Go to: http://localhost:5174/data-operator
   - Login with registered mobile + password
   - Click "প্রোফাইল যাচাই" card from dashboard

## Notes

- All text is in Bangla for user interface
- Edit functionality completely removed
- View-only access to farmer profiles
- Approve/reject updates database immediately
- Toast notifications provide instant feedback
- Responsive design works on mobile and desktop
