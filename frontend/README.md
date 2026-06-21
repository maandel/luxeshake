# LuxeShake Frontend Web Application

A premium, modern Next.js client ordering portal and administrative dashboard (**LuxeControl**) featuring a dark-gold theme, customized typography, and micro-interactions.

---

## Local Development Setup

### Prerequisites
*   Node.js 18+
*   npm or yarn package manager

### Steps
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
    The application will run locally at [http://localhost:3000](http://localhost:3000).

---

## Client State Management (Zustand Stores)

State is managed client-side using **Zustand** stores located in `src/lib/store/`:

*   **`authStore.ts`**: Persists authentication states including `accessToken` and user role (`superadmin`, `manager`, `staff`, `customer`).
*   **`cartStore.ts`**: Manages customer ordering selections, item additions, quantity modifications, shake sizes (small/large), totals, and checkout payload serialization.

---

## Axios API Client (`src/lib/api.ts`)

API interactions route through a configured Axios instance:

1.  **Request Interceptor**: Automatically attaches the JWT `access_token` as an `Authorization: Bearer <token>` header to all outgoing requests.
2.  **Response Interceptor (Silent Refresh)**: If a request fails with a `401 Unauthorized` status (e.g. token expired), the interceptor intercepts the failure, requests a new access token from the backend `/auth/refresh` endpoint using cookies, saves it to Zustand, and replays the original failed request seamlessly.

---

## LuxeControl Portal Routing & Forced Reset

All admin pages are located under the `/luxe-control/` router.

### Forced Password Changes
The top-level `layout.tsx` validates session status on mount. If the user is flagged with `must_reset_password: true` (e.g., after an administrative credentials reset):
*   The layout forces a redirect to `/luxe-control/change-password`.
*   All other routes are blocked.
*   The layout hides the sidebar menu, header user dropdown, and log-out controls, preventing the administrator from performing any system actions until a new password has been successfully configured.
