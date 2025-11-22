# AgriVista

A simple admin + user web app for managing announcements, activities, products, trainings and feedback.

**Notifications**

- **Recipients:**: Notifications are delivered to authenticated users and to administrators. System-generated notifications include:
  - announcements and product/training/activity updates for users who are signed in,
  - new feedback, system alerts, and admin-only events for administrators.
- **Instances:**: Notifications are surfaced in the app in two primary places:
  - UI components: `src/components/shared/NotificationMenu.vue` (persistent list) and `src/components/shared/AppSnackbar.vue` (transient toasts).
  - Backend / persistence: the notification records are stored in the `db/notifications.sql` schema and surfaced by the composable `src/composables/useNotifications.ts`.

**Database / SQL files**

- **Location:**: `db/` contains SQL schema and seed helpers for local or dev imports.
- **Files and purpose:**
  - `db/activities.sql`: schema / seeds for activities module
  - `db/announcements.sql`: schema / seeds for announcements
  - `db/carousel.sql`: schema / seeds for homepage carousel items
  - `db/feedbacks.sql`: schema / seeds for feedback messages submitted by users
  - `db/notifications.sql`: schema / seeds for notification records used by the app
  - `db/products.sql`: schema / seeds for product listings
  - `db/trainings.sql`: schema / seeds for training events

**Where to look in the code**

- **Notification UI:**: `src/components/shared/NotificationMenu.vue` and `src/components/shared/AppSnackbar.vue`.
- **Notification logic:**: `src/composables/useNotifications.ts` for fetching/managing notifications.
- **Other related areas:**: modules under `src/modules/roles/` (components and composables) implement the per-module behavior for announcements, activities, products and trainings.
