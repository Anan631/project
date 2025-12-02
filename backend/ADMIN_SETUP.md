# Admin Account Setup Guide

This guide explains how to securely create and manage admin accounts for the website.

## Security Features

✅ **Public registration blocked** - ADMIN role cannot be created through public registration endpoint  
✅ **Password strength requirements** - Minimum 12 characters with mixed case, numbers, and special characters  
✅ **Admin-only creation** - Only existing admins can create new admin accounts  
✅ **Authentication middleware** - All admin operations require authentication  
✅ **Self-deletion prevention** - Admins cannot delete their own accounts  
✅ **Last admin protection** - Cannot delete the last remaining admin account  

## Initial Admin Account Creation

### Method 1: Command Line Script (Recommended)

Use the secure script to create the first admin account:

```bash
cd backend
node scripts/create-admin.js <email> <password> <name>
```

**Example:**
```bash
node scripts/create-admin.js admin@example.com "SecurePass123!" "Admin User"
```

### Method 2: Interactive Mode

Run the script without arguments for interactive mode:

```bash
cd backend
node scripts/create-admin.js
```

The script will prompt you for:
- Admin email
- Admin password (must meet strength requirements)
- Admin name

### Password Requirements

- Minimum 12 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character (!@#$%^&*()_+-=[]{}|;':"\\,.<>/?)

## Creating Additional Admin Accounts

Once you have an initial admin account, you can create additional admins through the API:

### API Endpoint

**POST** `/api/admin/create-admin`

**Headers:**
```
x-admin-user-id: <admin_user_id>
```

**Body:**
```json
{
  "name": "New Admin Name",
  "email": "newadmin@example.com",
  "password_input": "SecurePass123!",
  "phone": "optional-phone-number"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin account created successfully",
  "user": {
    "id": "...",
    "name": "New Admin Name",
    "email": "newadmin@example.com",
    "role": "ADMIN",
    "status": "ACTIVE"
  }
}
```

## Admin API Endpoints

All admin endpoints require authentication via `x-admin-user-id` header.

### List All Admins

**GET** `/api/admin/admins`

**Headers:**
```
x-admin-user-id: <admin_user_id>
```

### Delete Admin Account

**DELETE** `/api/admin/:id`

**Headers:**
```
x-admin-user-id: <admin_user_id>
```

**Note:** Cannot delete your own account or the last remaining admin.

## Security Best Practices

1. **Strong Passwords**: Always use strong, unique passwords for admin accounts
2. **Limit Admin Count**: Only create as many admin accounts as necessary
3. **Regular Audits**: Periodically review admin accounts and remove unused ones
4. **Secure Storage**: Store admin credentials securely (password manager)
5. **Change Defaults**: Change admin password immediately after first login
6. **Monitor Access**: Regularly check admin login logs
7. **Script Security**: Consider deleting or securing the `create-admin.js` script after initial setup

## Authentication Flow

The current implementation uses user ID-based authentication. For production, consider:

- **JWT Tokens**: Implement JWT-based authentication for better security
- **Session Management**: Add proper session management
- **2FA**: Implement two-factor authentication for admin accounts
- **Rate Limiting**: Add rate limiting to prevent brute force attacks
- **IP Whitelisting**: Consider IP whitelisting for admin endpoints

## Troubleshooting

### "Admin accounts cannot be created through public registration"

This is expected behavior. Use the admin creation script or API endpoint instead.

### "Admin authentication required"

Make sure you're including the `x-admin-user-id` header in your requests, or `adminUserId` in the request body.

### "Cannot delete the last admin account"

At least one active admin account must always exist. Create another admin account first if you need to delete one.

### "Password must be at least 12 characters"

Admin passwords have stricter requirements. Ensure your password meets all requirements listed above.

## Next Steps

After creating your admin account:

1. Test login at `/admin-login`
2. Access admin dashboard at `/admin`
3. Create additional admin accounts if needed
4. Review and secure admin routes
5. Consider implementing JWT authentication for production




