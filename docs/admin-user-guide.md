ADMIN PANEL USER GUIDE

Overview
This documentation provides a detailed overview of the Omnichannel Ecommerce Admin Panel. It outlines the workflows for managing the store, inventory, orders, and team members effectively.

--------------------------------------------------------------------------------

1. GETTING STARTED: KEY WORKFLOWS & DEPENDENCIES

To ensure the system functions correctly, please adhere to the following setup sequences:

INITIAL CONFIGURATION (Crucial First Step)
Sequence: General Settings -> Shop Type

1. General Settings (Configuration > Settings)
   Set your store name, currency, and basic preferences.

2. Shop Type Selection
   Select your business model (Restaurant vs Retail). This fundamentally alters the available features (e.g., Table Management vs Shipping).

STOREFRONT SETUP (Display Logic)
Sequence: Sections -> Categories -> Products

1. Create Home Page Sections (Configuration > Landing Page)
   These define the specific areas on the homepage (e.g., "New Arrivals") where products will be displayed.

2. Create Categories (Main > Categories)
   These are the primary classifications for products (e.g., "Live Crab", "Frozen Shrimp").

3. Add Products (Main > Products)
   When creating a product, it must be assigned to both a Category (for organization) and a Section (for homepage visibility).

TEAM SETUP (Access Control)
Sequence: Hubs -> Users -> Assignment

1. Create Hubs (Configuration > Manage Shop > Hubs)
   Define physical locations or operational hubs first.

2. Add Users (Main > Users)
   Create accounts for staff and managers.

3. Assign Roles & Hubs
   During user creation, assign the relevant Hub to ensure the user has access to the correct inventory and orders.

INVENTORY LOGIC
Sequence: Products -> Hubs -> Stock Update

1. Create Products
   Define the item in the system.

2. Ensure Hubs Exist
   Verify that branch locations are active.

3. Update Stock (Configuration > Inventory)
   Navigate to the Inventory tab to manage stock levels specific to each Hub.

--------------------------------------------------------------------------------

2. USER ROLES & ACCESS

The system enforces role-based access control:

Shop Admin (Tenant Admin)
- Access: Full system control.
- Capabilities: Manage configuration, users, products, orders, and financial reports. Capable of creating and assigning Hub Managers.

Hub Manager (Hub Admin)
- Access: Restricted to an assigned Hub.
- Capabilities: Manage orders and inventory specifically for their hub. Can oversee Staff within that hub.

Staff
- Access: Limited access based on permissions.
- Capabilities: Primarily handling order fulfillment and basic operational tasks.

--------------------------------------------------------------------------------

3. DASHBOARD

The Dashboard provides a real-time summary of business performance:

- Key Metrics: Displays Total Revenue, Active Order counts, and Low Stock warnings.
- Sales Chart: Visualizes revenue trends over selected periods.
- Activity Log: Records recent login events and critical actions for security auditing.

--------------------------------------------------------------------------------

4. ORDER MANAGEMENT

The Orders module is the central hub for processing customer transactions.

- Order List: Filter by status (Pending, Processing, Delivered) or search by ID/Name.
- Processing: Open an order to update its status or print a professional invoice.
- Manual Entry: Use "Create Order" to manually input phone or offline orders, allowing for product selection and customer detail entry.

--------------------------------------------------------------------------------

5. PRODUCT CATALOG

Manage the inventory catalog through the Products and Categories modules.

PRODUCTS
- Creation: Enter product details including Name, Price, and Description.
- Variants: Configure options such as Weight (e.g., 500g, 1kg) or Type (e.g., Live, Frozen).
- SEO: Input custom meta titles and descriptions for search engine optimization.

CATEGORIES
- Organization: Group products logically (e.g., "Crabs", "Spices").
- Visibility: Mark categories as "Featured" to highlight them on the storefront.

--------------------------------------------------------------------------------

6. INVENTORY MANAGEMENT

Stock levels can be managed in two ways:

1. Quick Update: Edit the "Stock in Units" field directly within the Products list for general stock.

2. Inventory Module: Use the dedicated Inventory tab to manage stock across multiple Hubs and view low-stock alerts (triggered when stock falls below 10 units).

--------------------------------------------------------------------------------

7. CUSTOMER MANAGEMENT

The Customers module provides insights into the user base.

- History: Review total spending and order frequency for individual customers.
- Data: Access contact information for support and marketing purposes.

--------------------------------------------------------------------------------

8. MARKETING & DESIGN

Customize the storefront appearance and promotional activities.

- Theme: Adjust brand colors and upload logos.
- Landing Page: Configure the Hero Banner and rearrange homepage sections.
- Promo Codes: Detailed creation of discount coupons with usage limits and expiry settings.

--------------------------------------------------------------------------------

9. REPORTS & ANALYTICS

- Analytics: View revenue breakdowns and top-performing products.
- Event Matrix: Analyze user behavior patterns (e.g., Cart Additions).
- Reviews: Moderate and respond to customer feedback.

--------------------------------------------------------------------------------

10. CONFIGURATION & SECURITY

- General Settings: Update site identity and contact details.
- Checkout Config: Specific delivery charges, tax rates, and payment methods.
- Security: Monitor active sessions via "Trusted Devices" and review audit logs for system changes.

--------------------------------------------------------------------------------

11. TEAM MANAGEMENT

- User Creation: Invite new members and assign specific roles.
- Permission Checks: Use "Manage Access" to fine-tune Staff permissions.
- Security Actions: Reset passwords or disable accounts as required.

--------------------------------------------------------------------------------

For technical assistance, please contact the system administrator.
