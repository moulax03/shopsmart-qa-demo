# ShopSmart Test Cases

**Total test cases:** 20

| Test Case ID | Scenario ID | Test Type | Severity | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC_01 | SS-AUTH-001 | Positive | High | Login with valid seeded customer credentials | 1. Open Login page<br>2. Enter valid email and password<br>3. Click Login | john.doe@testshop.com / TestPass1! | User is authenticated; session/token is established; user is redirected to an authenticated page and name/account controls are displayed. |  |
| TC_02 | SS-CART-002 | Positive | High | Update cart quantity to valid value | 1. Change quantity to 2<br>2. Apply/update quantity |  | Quantity and line/subtotal/grand totals recalculate accurately. |  |
| TC_03 | SS-CHECKOUT-001 | Positive | Critical | Checkout with valid shipping and demo payment details | 1. Click Proceed to Checkout<br>2. Enter valid shipping details<br>3. Enter valid demo card details<br>4. Click Place Order | Demo card: any accepted 16-digit number; expiry in future; valid CVV | Order is created once; confirmation page displays order number, items, shipping address and correct totals; cart is cleared. |  |
| TC_04 | SS-DETAIL-001 | Positive | High | Open details for a valid product | 1. Click View Details on a product |  | Detail page shows correct product name, category, price, description, stock, quantity control and Add to Cart. |  |
| TC_05 | SS-DETAIL-003 | Positive | High | Add valid quantity to cart | 1. Enter quantity 1<br>2. Click Add to Cart | Air Fryer 4QT; quantity 1 | Cart is updated with selected product and quantity; confirmation feedback/cart badge updates. |  |
| TC_06 | SS-HOME-001 | Positive | High | Load home page | 1. Open application root/index.html |  | ShopSmart home page loads; header navigation, hero banner, category section and featured products are visible. |  |
| TC_07 | SS-ORDER-001 | Positive | High | Display order confirmation after successful purchase | 1. Inspect confirmation page |  | Confirmation includes success message, unique order number, date, items, quantities, unit price and total. |  |
| TC_08 | SS-ORDER-003 | Positive | High | View order history | 1. Click Orders |  | Only current user's orders are shown with order number, date, status, items, total and View action. |  |
| TC_09 | SS-PROD-002 | Positive | High | Search using exact product name | 1. Enter an existing product name<br>2. Click Search | Air Fryer 4QT | Matching product(s) are displayed; unrelated products are excluded. |  |
| TC_10 | SS-PROD-006 | Positive | High | Filter products by one category | 1. Select one category checkbox | Kitchen | Only products belonging to selected category are displayed; count updates. |  |
| TC_11 | SS-AUTH-002 | Negative | High | Login with incorrect password | 1. Enter registered email<br>2. Enter incorrect password<br>3. Click Login | john.doe@testshop.com / WrongPass! | Login is rejected with a clear error; no authenticated session is created; password is not exposed. |  |
| TC_12 | SS-AUTH-007 | Negative | High | Open protected API without token | 1. Send GET /api/cart without Authorization header | GET /api/cart | API returns an unauthorized response; no private cart data is returned. |  |
| TC_13 | SS-CART-006 | Negative | High | Checkout with empty cart | 1. Navigate to Cart<br>2. Click Proceed to Checkout if available |  | Checkout is blocked or empty-cart message is shown; no order is created. |  |
| TC_14 | SS-CHECKOUT-002 | Negative | High | Submit checkout with required shipping fields empty | 1. Clear required address/name fields<br>2. Click Place Order |  | Required fields are validated; order is not placed. |  |
| TC_15 | SS-CHECKOUT-004 | Negative | High | Submit invalid card number length/characters | 1. Enter short or alphabetic card number<br>2. Submit order |  | Payment validation rejects invalid card input; no order is created. |  |
| TC_16 | SS-CHECKOUT-008 | Negative | Critical | Double-click Place Order / repeat request | 1. Click Place Order twice rapidly or replay request |  | Only one order is created; duplicate submission is prevented or safely idempotent. |  |
| TC_17 | SS-DETAIL-004 | Negative | High | Add zero quantity to cart | 1. Enter quantity 0<br>2. Click Add to Cart |  | Quantity validation prevents adding zero or invalid quantity. |  |
| TC_18 | SS-DETAIL-006 | Negative | High | Add quantity greater than available stock | 1. Enter quantity greater than stock<br>2. Click Add to Cart |  | Stock validation prevents overselling and provides a useful message. |  |
| TC_19 | SS-ORDER-006 | Negative | Critical | Access another user's order by ID | 1. Call GET /api/orders/{other-user-order-id} as current user |  | Access is denied/not found; no other user's order or address is disclosed. |  |
| TC_20 | SS-PROD-004 | Negative | Medium | Search with no matching product | 1. Search for a random nonexistent term | zz-no-product-999 | No-results state/message is displayed; page remains stable. |  |
