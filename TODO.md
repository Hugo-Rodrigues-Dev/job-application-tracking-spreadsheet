# Job Application Tracker – To Do List

## To Do
- [ ] Display the add/edit form inside a modal overlay rather than inline on the dashboard.
- [ ] Add multilingual support (switch between French and English UI labels).
- [ ] Introduce an archive workflow with a dedicated page and quick archive action.
- [ ] Replace localStorage with a proper database (e.g. Supabase) to store applications securely.
- [ ] Add secure user authentication and account management (via Supabase Auth or equivalent) to allow data sync across devices.
- [ ] Design reminder/notification system for follow-ups.
- [ ] Add user settings for customizing the dashboard view (dark mode, ...).

## Done
- [x] Add confirmation dialogs before saving, deleting, or canceling form changes.
- [x] Implement import functionality to bring in data from Excel for example.
- [x] Sort applications by status and date applied by default.
- [x] Add pagination to the application list for better performance with many entries.
- [x] Implement Excel export for the application list.
- [x] Implement data persistence so applications survive page reloads.
- [x] Build core job application tracker with filters, search, and metrics.
- [x] Application foundation and initial project setup.
