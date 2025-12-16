# Authentication Issue - User 31 Showing as Data Operator

## Problem
User ID 31 is a farmer in the database but appearing as data operator in frontend.

## Root Cause
This is likely due to cached authentication data in localStorage. The browser may have old/wrong token data.

## Solution Steps

### Option 1: Clear Browser Storage (Recommended)
1. Open browser Developer Tools (F12)
2. Go to Application/Storage tab
3. Click on "Local Storage"
4. Click on your site URL (http://localhost:5174)
5. Clear all entries OR delete these specific keys:
   - `auth_token`
   - `user`
   - `user_data`
6. Reload the page (Ctrl + R)
7. Login again as Data Operator

### Option 2: Use Logout Button
1. Click Logout from the current session
2. Login again with correct credentials
   - Data Operator phone: 01888636715

### Option 3: Run This in Browser Console
```javascript
localStorage.clear();
location.reload();
```

## Verification
After clearing and logging in again:
- Data Operator should see user_id 39 (phone: 01888636715)
- User 31 (phone: 01970890839) should only appear in the Farmers List, not as logged-in data operator

## Technical Details
- User ID 39 = Data Operator (01888636715) ✅
- User ID 31 = Farmer (01970890839) - কালা সামির ✅

Database is correct. Only frontend localStorage had cached wrong data.
