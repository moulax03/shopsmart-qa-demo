# ShopSmart — Intentional Bugs Reference (Instructor Only)

This file documents all 15 intentional bugs planted in the ShopSmart codebase for QA training purposes.
**Do not share this file with students.** It is the answer key.

---

## BUG-001 — Login: Password Never Verified

| Field | Value |
|-------|-------|
| **ID** | BUG-001 |
| **Module** | Authentication |
| **Layer** | API (backend) |
| **Severity** | Critical |
| **File** | `routes/auth.js` |
| **Approx. Line** | ~75 (login handler, after user lookup) |

### Description
The `POST /api/auth/login` endpoint **never checks the password**. If the email exists in the database, a valid JWT token is returned with HTTP 200 regardless of what password the user provides — even a completely wrong one, an empty string, or a random value.

### How to Find It
1. Create an account or use a seeded account: `john.doe@testshop.com / TestPass1!`
2. Attempt to log in with the correct email but a **wrong password** (e.g., `wrongpassword`)
3. **Actual:** HTTP 200 is returned with `"status": "success"` and a valid token
4. **Expected:** HTTP 401 with `"status": "error"` and `"code": "INVALID_CREDENTIALS"`

### Postman Test
```
POST /api/auth/login
Body: { "email": "john.doe@testshop.com", "password": "WRONG_PASSWORD" }
Expected: 401
Actual: 200 with valid JWT token
```

### Root Cause
In `routes/auth.js`, the bcrypt password comparison (`bcrypt.compareSync(password, user.password)`) is **commented out / never called**. The code jumps directly to generating the token after finding the user by email.

---

## BUG-002 — Forgot Password: No Email Validation

| Field | Value |
|-------|-------|
| **ID** | BUG-002 |
| **Module** | Authentication |
| **Layer** | API (backend) |
| **Severity** | Low |
| **File** | `routes/auth.js` |
| **Approx. Line** | ~95 (forgot-password handler) |

### Description
The `POST /api/auth/forgot-password` endpoint accepts **any input** without email format validation and always returns HTTP 200 success. Inputs like `"notanemail"`, `"123"`, `""` (empty string), or even no body at all receive the same success response.

### How to Find It
```
POST /api/auth/forgot-password
Body: { "email": "notanemail" }   → 200 success
Body: { "email": "123" }          → 200 success
Body: { "email": "" }             → 200 success
Body: {}                          → 200 success
```

**Expected for invalid inputs:** HTTP 400 with `"code": "VALIDATION_ERROR"`

### Root Cause
The forgot-password handler immediately returns `res.status(200).json(...)` without any validation of the `email` field.

---

## BUG-003 — Product: Negative Price in Seed Data

| Field | Value |
|-------|-------|
| **ID** | BUG-003 |
| **Module** | Products / Seed Data |
| **Layer** | Database (data quality) |
| **Severity** | Medium |
| **File** | `database/seed.js` |
| **Approx. Line** | ~80 (prod_006 entry) |

### Description
Product `prod_006` ("Bluetooth Speaker Portable") has a price of **`-5.00`** (negative five dollars). This value appears in the product listing, product detail page, cart, and order total — allowing a negative price to reduce the cart total.

### How to Find It
1. Browse to `GET /api/products` — `prod_006` shows `"price": -5`
2. Add `prod_006` to cart — the cart total decreases
3. The product listing page shows `-$5.00` in red

### Root Cause
In `database/seed.js`, `prod_006` is seeded with `price: -5.00`. The schema uses `REAL` with no `CHECK (price >= 0)` constraint.

---

## BUG-004 — Cart: Accepts Quantity Zero

| Field | Value |
|-------|-------|
| **ID** | BUG-004 |
| **Module** | Cart |
| **Layer** | API (backend) |
| **Severity** | Medium |
| **File** | `routes/cart.js` |
| **Approx. Line** | ~55 (POST /api/cart/items) |

### Description
The `POST /api/cart/items` endpoint accepts `quantity: 0` and adds a zero-quantity item to the cart without returning a validation error.

### How to Find It
```
POST /api/cart/items
Authorization: Bearer <token>
Body: { "productId": "prod_001", "quantity": 0 }
Expected: 400 with validation error
Actual: 200 — item added with quantity: 0
```

### Root Cause
The quantity validation only checks `isNaN(qty)` but does not check `qty <= 0`. The guard `if (qty <= 0) return 400` is intentionally missing.

---

## BUG-005 — Cart Page: Order Summary Doesn't Update on Quantity Change

| Field | Value |
|-------|-------|
| **ID** | BUG-005 |
| **Module** | Cart |
| **Layer** | UI (frontend) |
| **Severity** | Medium |
| **File** | `public/cart.html` |
| **Approx. Line** | ~115 (updateQuantity function) |

### Description
When a user changes the quantity of an item in the cart and clicks away (blur event), the API is called to update the quantity. However, the **Order Summary sidebar** (Subtotal, Shipping, Total) is **never recalculated**. It continues showing the totals from when the page first loaded.

### How to Find It
1. Add 2+ items to cart, go to `/cart.html`
2. Note the displayed total (e.g., $35.94)
3. Change one item's quantity to 5
4. Click outside the input (blur)
5. **Actual:** Summary still shows $35.94
6. **Expected:** Summary should update to reflect the new quantity
7. Reload the page — now the correct total appears

### Root Cause
In `cart.html`, the `updateQuantity()` function calls the API but intentionally does **not** update the `#summary-subtotal`, `#summary-shipping`, and `#summary-total` DOM elements with the new values returned by the API response.

---

## BUG-006 — Checkout: Missing Shipping Address Not Validated

| Field | Value |
|-------|-------|
| **ID** | BUG-006 |
| **Module** | Checkout |
| **Layer** | API (backend) + UI (frontend) |
| **Severity** | Medium |
| **File** | `routes/checkout.js` (API), `public/checkout.html` (UI) |
| **Approx. Line** | ~35 (checkout.js), ~170 (checkout.html placeOrder) |

### Description
The `POST /api/checkout` endpoint does **not validate that `shippingAddress` is present or has required fields**. If the field is omitted, the order is created successfully with `shippingAddress` stored as `{}`. The frontend also does not require the shipping fields before submission.

### How to Find It
```
POST /api/checkout
Authorization: Bearer <token>
Body: { "payment": { "cardNumber": "1234567890123456", "expiryYear": 2026, "cvv": "123" } }
(Note: shippingAddress is completely omitted)
Expected: 400 — shipping address required
Actual: 201 — order created with shippingAddress: {}
```

### Root Cause
Both `routes/checkout.js` and `public/checkout.html` intentionally skip the check for `shippingAddress`.

---

## BUG-007 — Orders List: Most Recent Order Is Excluded

| Field | Value |
|-------|-------|
| **ID** | BUG-007 |
| **Module** | Orders |
| **Layer** | API (backend) |
| **Severity** | High |
| **File** | `routes/orders.js` |
| **Approx. Line** | ~45 (GET /api/orders handler) |

### Description
The `GET /api/orders` endpoint uses `.slice(1)` on the sorted result set, which removes the **most recently placed order** from the response. If a user has N orders, only N-1 orders are returned (all except the most recent).

### How to Find It
1. Log in as `john.doe@testshop.com`
2. Place a new order via checkout
3. Navigate to `GET /api/orders`
4. **Actual:** The just-placed order is missing from the list
5. **Expected:** All orders including the most recent one should be returned
6. You can verify the order **does exist** by calling `GET /api/orders/:id` with the ID from the checkout confirmation

### Root Cause
In `routes/orders.js`, after fetching all orders: `const ordersWithoutMostRecent = allOrders.slice(1);`. This slices off index 0 (most recent, since results are sorted `DESC`).

---

## BUG-008 — Profile: Phone Number Not Validated

| Field | Value |
|-------|-------|
| **ID** | BUG-008 |
| **Module** | Profile |
| **Layer** | API (backend) + UI (frontend) |
| **Severity** | Low |
| **File** | `routes/profile.js` |
| **Approx. Line** | ~40 (PUT /api/profile) |

### Description
The `PUT /api/profile` endpoint accepts **any string** as a phone number without format validation. Values like `"abc-not-valid"`, `"hello world"`, `"@#$%"`, or `"1"` are stored in the database without any error.

### How to Find It
```
PUT /api/profile
Authorization: Bearer <token>
Body: { "firstName": "John", "lastName": "Doe", "phone": "abc-not-valid" }
Expected: 400 with phone validation error
Actual: 200 — "abc-not-valid" stored as phone number
```

### Root Cause
In `routes/profile.js`, there is intentionally no regex or length check for the `phone` field. The comment in the code reads: `// BUG-008: No phone validation.`

---

## BUG-009 — Order Detail: IDOR (Insecure Direct Object Reference)

| Field | Value |
|-------|-------|
| **ID** | BUG-009 |
| **Module** | Orders |
| **Layer** | API (backend) |
| **Severity** | Critical (Security) |
| **File** | `routes/orders.js` |
| **Approx. Line** | ~75 (GET /api/orders/:id) |

### Description
The `GET /api/orders/:id` endpoint does **not check whether the order belongs to the requesting user**. Any authenticated user who knows or guesses a valid order ID can retrieve the full order details (items, shipping address, totals) of any other user's order.

### How to Find It
1. Log in as `sara.lee@testshop.com` and get a JWT token
2. Get the known order IDs for `john.doe@testshop.com` (e.g., `order_001`)
3. Call `GET /api/orders/order_001` with Sara's token
4. **Actual:** Full order details for John's order are returned
5. **Expected:** 403 Forbidden (the order belongs to a different user)

### Root Cause
In `routes/orders.js`, the query only filters by `id` (not by `userId`): `db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)`. The ownership check is intentionally omitted.

---

## BUG-010 — Signup: Duplicate Email Error Silently Swallowed

| Field | Value |
|-------|-------|
| **ID** | BUG-010 |
| **Module** | Authentication |
| **Layer** | UI (frontend) |
| **Severity** | Medium |
| **File** | `public/signup.html` |
| **Approx. Line** | ~90 (409 handler in form submit) |

### Description
When a user tries to sign up with an email that already exists in the system, the API correctly returns HTTP 409 with an error message. However, the **frontend ignores this response entirely** — the form is silently cleared (reset) with no error message, no toast, and no visual indication that the email is already taken.

### How to Find It
1. Go to `/signup.html`
2. Fill in the form using `john.doe@testshop.com` (already seeded)
3. Click "Create Account"
4. **Actual:** Form fields clear silently — no feedback
5. **Expected:** Error message "An account with this email address already exists." should appear

### Root Cause
In `signup.html`, the `status === 409` branch calls `document.getElementById('signup-form').reset()` and then intentionally returns without showing any message.

---

## BUG-011 — Product Detail: Out-of-Stock Badge Missing, Button Always Enabled

| Field | Value |
|-------|-------|
| **ID** | BUG-011 |
| **Module** | Products |
| **Layer** | UI (frontend) |
| **Severity** | Medium |
| **File** | `public/product-detail.html` |
| **Approx. Line** | ~60 (product rendering) |

### Description
On the product detail page, out-of-stock products (e.g., `prod_004` "Yoga Mat" with `stockCount: 0`) show the numeric stock count (`"0 available"`) but do **not** display an "Out of Stock" badge. The "Add to Cart" button is also **always enabled**, allowing users to attempt to add out-of-stock items. (The API will still return an error since stock is 0, but the UI provides no warning.)

### How to Find It
1. Navigate to `/product-detail.html?id=prod_004`
2. **Actual:** Page shows "0 available" with an enabled "Add to Cart" button
3. **Expected:** "Out of Stock" badge should display, and the Add to Cart button should be disabled or hidden

Note: The product listing page (`products.html`) correctly shows the Out of Stock badge. Only the detail page is affected.

### Root Cause
In `product-detail.html`, the comment `<!-- BUG-011: Out of Stock badge intentionally omitted -->` reveals the missing conditional rendering.

---

## BUG-012 — Cart Delete: Returns 200 for Non-Existent Item

| Field | Value |
|-------|-------|
| **ID** | BUG-012 |
| **Module** | Cart |
| **Layer** | API (backend) |
| **Severity** | Low |
| **File** | `routes/cart.js` |
| **Approx. Line** | ~130 (DELETE /api/cart/items/:id) |

### Description
The `DELETE /api/cart/items/:id` endpoint returns HTTP 200 success even when the cart item ID does **not exist** in the database. A correct REST API should return 404.

### How to Find It
```
DELETE /api/cart/items/nonexistent-item-id-12345
Authorization: Bearer <token>
Expected: 404 Not Found
Actual: 200 { "status": "success", "message": "Item removed from cart." }
```

### Root Cause
In `routes/cart.js`, the non-existence case explicitly returns 200 instead of 404, with the comment: `// BUG-012: Should return 404 here, but we return 200 instead.`

---

## BUG-013 — Checkout: Double-Click Creates Duplicate Orders

| Field | Value |
|-------|-------|
| **ID** | BUG-013 |
| **Module** | Checkout |
| **Layer** | UI (frontend) |
| **Severity** | High |
| **File** | `public/checkout.html` |
| **Approx. Line** | ~165 (placeOrder function) |

### Description
The "Place Order" button on the checkout page has **no loading state and no disabled-after-click logic**. A user who double-clicks or rapidly clicks the button will fire two (or more) `POST /api/checkout` requests. The first request clears the cart; the second request returns a 400 "cart is empty" error, but in practice on a fast connection both can succeed, creating two orders.

### How to Find It
1. Add items to cart and go to checkout
2. Fill in valid payment details
3. Double-click "Place Order" rapidly
4. **Actual:** Two requests are sent; potentially two orders created
5. **Expected:** Button should be disabled immediately after first click and show a loading state

### Root Cause
In `checkout.html`, the `placeOrder()` function intentionally has the comment `// BUG-013: Button is NOT disabled here`. No `btn.disabled = true` or spinner is added before the API call.

---

## BUG-014 — Products Sort: Price Sort Uses Name Column

| Field | Value |
|-------|-------|
| **ID** | BUG-014 |
| **Module** | Products |
| **Layer** | API (backend) |
| **Severity** | Medium |
| **File** | `routes/products.js` |
| **Approx. Line** | ~60 (ORDER BY construction) |

### Description
When products are sorted by `price_asc` or `price_desc`, the API **sorts by `name` instead of `price`**. The result appears alphabetically sorted rather than by price. Name-based sorts (`name_asc`, `name_desc`) work correctly.

### How to Find It
```
GET /api/products?sort=price_asc
Expected: Products sorted cheapest to most expensive (Gym Gloves $14.99, Resistance Bands $19.99, ...)
Actual: Products sorted A-Z by name (Air Fryer, Blender, Bookshelf, ...)
```

### Root Cause
In `routes/products.js`, the `price_asc` and `price_desc` cases in the sort mapping use `ORDER BY name ASC/DESC` instead of `ORDER BY price ASC/DESC`.

---

## BUG-015 — Login: User Name Not Saved to localStorage

| Field | Value |
|-------|-------|
| **ID** | BUG-015 |
| **Module** | Authentication |
| **Layer** | UI (frontend) |
| **Severity** | Low |
| **File** | `public/login.html` |
| **Approx. Line** | ~65 (after successful login response) |

### Description
After a successful login, the frontend saves **only the JWT token** to `localStorage` — it does **not** save the user's name/profile data. As a result, the navbar greeting shows "Account" (generic) instead of the user's name. The name only appears after:
- Visiting `/profile.html` (which fetches the profile and updates localStorage), or
- A manual profile API call.

### How to Find It
1. Log in as any seeded user
2. After redirect to `products.html`, look at the navbar user menu
3. **Actual:** Shows "Account" (no name)
4. **Expected:** Should show "John Doe" or the user's actual name
5. Visit `/profile.html` — now the name appears in the navbar

### Root Cause
In `login.html`, `setAuth(token, null)` is called with `null` for the user object (the API response includes `data.data.user` but it is intentionally not passed to `setAuth`).

---

## Summary Table

| ID | Module | Layer | Severity | Description |
|----|--------|-------|----------|-------------|
| BUG-001 | Auth | API | Critical | Login accepts any password for existing emails |
| BUG-002 | Auth | API | Low | Forgot-password accepts any input, no email validation |
| BUG-003 | Products | Data | Medium | prod_006 has negative price (-$5.00) |
| BUG-004 | Cart | API | Medium | Quantity: 0 is accepted without validation error |
| BUG-005 | Cart | UI | Medium | Order summary not recalculated after quantity update |
| BUG-006 | Checkout | API+UI | Medium | Missing shippingAddress creates order with empty address |
| BUG-007 | Orders | API | High | Most recent order excluded from order list |
| BUG-008 | Profile | API+UI | Low | Phone number accepts any string, no format validation |
| BUG-009 | Orders | API | Critical | IDOR: any user can view any order by ID |
| BUG-010 | Auth | UI | Medium | Duplicate email signup silently resets form |
| BUG-011 | Products | UI | Medium | Out-of-stock badge/button state missing on detail page |
| BUG-012 | Cart | API | Low | DELETE cart item returns 200 for non-existent ID |
| BUG-013 | Checkout | UI | High | No button disable — double-click creates duplicate orders |
| BUG-014 | Products | API | Medium | price_asc/price_desc sort actually sorts by name |
| BUG-015 | Auth | UI | Low | User name not saved to localStorage after login |
