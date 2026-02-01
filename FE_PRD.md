# Product Requirements Document (PRD)

## Project Management System Frontend

### 1. Product Overview

**Product Name:** Project Camp Frontend  
**Version:** 1.0.0  
**Product Type:** Frontend Microservice for Project Management System

Project Camp Frontend is a responsive Single Page Application (SPA) built with React.js, designed to provide an intuitive user interface for the Project Camp Backend API. It enables users to manage projects collaboratively, including task handling with subtasks, project notes, and role-based access. The frontend consumes RESTful APIs from the backend, handles authentication, and ensures a seamless user experience across devices.

The frontend is deployed as a microservice, focusing on client-side rendering, state management, and secure API interactions. It supports light/dark themes, responsive design, and accessibility features.

### 2. Target Users

- **Project Administrators (Admin Role):** Full access to create/manage projects, members, tasks, notes.
- **Project Admins (Project Admin Role):** Manage tasks and subtasks within projects, view notes and members.
- **Team Members (Member Role):** View projects, update task/subtask status, access notes and details.

### 3. Core Features

#### 3.1 User Authentication & Authorization

- **Registration:** Form for new user signup with email verification prompt.
- **Login:** Secure login form with JWT handling.
- **Password Management:** Forms for change password, forgot/reset password.
- **Email Verification:** Auto-verification via URL token.
- **Logout:** Clear session and redirect to login.
- **Role-Based UI:** Hide/show features based on user role (e.g., hide "Delete Project" for non-admins).
- **Token Refresh:** Automatic refresh of access tokens in API calls.

#### 3.2 Project Management

- **Project Creation:** Form for new project (name, description) – Admin only.
- **Project Listing:** Dashboard view of accessible projects with search/filter.
- **Project Details:** Detailed view with tabs for overview, tasks, notes, members.
- **Project Updates:** Edit form for project info – Admin only.
- **Project Deletion:** Confirmation modal – Admin only.

#### 3.3 Team Member Management

- **Member Addition:** Invite form (email) – Admin only.
- **Member Listing:** Table view of members with roles.
- **Role Management:** Dropdown to update roles – Admin only.
- **Member Removal:** Confirmation modal – Admin only.

#### 3.4 Task Management

- **Task Creation:** Form with title, description, assignee, status, file attachments – Admin/Project Admin only.
- **Task Listing:** Table with sorting, filtering by status/assignee.
- **Task Details:** View/edit form, file previews/downloads.
- **Task Updates:** Modify details/status – Admin/Project Admin only; members can update status if assigned.
- **Task Deletion:** Confirmation modal – Admin/Project Admin only.
- **File Attachments:** Multiple file upload/preview (images/documents).
- **Status Tracking:** Dropdown for Todo, In Progress, Done.

#### 3.5 Subtask Management

- **Subtask Creation:** Form to add to tasks – Admin/Project Admin only.
- **Subtask Updates:** Toggle completion status – All roles (members for their assigned).
- **Subtask Deletion:** Confirmation modal – Admin/Project Admin only.

#### 3.6 Project Notes

- **Note Creation:** Form for new notes – Admin only.
- **Note Listing:** Card-based list view.
- **Note Details:** View/edit content.
- **Note Updates:** Modify notes – Admin only.
- **Note Deletion:** Confirmation modal – Admin only.

#### 3.7 System Health & Utilities

- **Health Check Integration:** Optional dashboard widget showing backend status.
- **Search Functionality:** Global search across projects/tasks/notes.
- **Notifications:** Toasts for success/errors (e.g., "Project created").
- **Theme Toggle:** Light/dark mode switch.
- **Accessibility:** ARIA labels, keyboard navigation.

### 4. Technical Specifications

#### 4.1 Architecture & Tech Stack

- **Framework:** React.js (v18+) with Hooks.
- **State Management:** Redux Toolkit for global state (auth, projects, tasks, etc.).
- **Routing:** React Router v6 for navigation.
- **Styling:** Material-UI (MUI) v5 for components and themes.
- **Forms:** React Hook Form with validation.
- **API Client:** Axios with interceptors for auth tokens and error handling.
- **Notifications:** React-Toastify.
- **File Handling:** FormData for uploads.
- **Testing:** Jest for units, React Testing Library for components.
- **Deployment:** Dockerized microservice, deployable to Vercel/Netlify/Kubernetes.
- **Environment Variables:** API base URL, e.g., `REACT_APP_API_URL=/api/v1/`.

#### 4.2 Pages (Routes)

All pages use a layout wrapper for authenticated routes (Header, Sidebar, Footer). Unauthenticated routes are bare.

- **/login**: Login form.
- **/register**: Registration form.
- **/forgot-password**: Forgot password form.
- **/reset-password/:resetToken**: Reset password form.
- **/verify-email/:verificationToken**: Email verification handler (auto-redirect).
- **/** (Dashboard): Overview of projects (grid of cards).
- **/projects**: List of projects (table or cards).
- **/projects/:projectId**: Project details with tabs (Overview, Tasks, Members, Notes).
- **/projects/:projectId/t/:taskId**: Task details/edit.
- **/projects/:projectId/n/:noteId**: Note details/edit.
- **/settings**: User settings (profile, change password).
- **/***: 404 Not Found page.

Protected routes require authentication; role-based guards (e.g., via HOCs) enforce permissions.

#### 4.3 Components

**Layout Components:**
- **Header**: AppBar with logo, search bar, user dropdown (Profile, Settings, Logout), theme toggle.
- **Sidebar**: Drawer with navigation links (Dashboard, Projects, Settings) and icons.
- **Footer**: Simple copyright and links.
- **LayoutWrapper**: Combines Header, Sidebar, Main content, Footer for protected pages.

**Common Components:**
- **CustomButton**: Variants (primary, secondary, danger).
- **CustomInput**: TextField with validation.
- **CustomSelect**: Dropdown for roles/statuses.
- **ModalDialog**: For confirmations/edits.
- **Loader**: Circular progress spinner.
- **ErrorAlert**: Alert for errors.
- **FileUpload**: Input for multiple files with preview.
- **ToastNotification**: For success/error messages.

**Specific Components:**
- **ProjectCard**: Displays project name, description, member count, action buttons.
- **TaskTable**: DataGrid for tasks (columns: title, assignee, status, actions); expandable for subtasks.
- **SubtaskList**: List of items with checkboxes for completion.
- **NoteCard**: Card with note content, edit/delete buttons.
- **MemberTable**: DataGrid for members (columns: name, email, role dropdown).
- **TabPanel**: For project details tabs.
- **SearchBar**: Input for filtering lists.

#### 4.4 API Integration

The frontend integrates with all backend endpoints listed in the Backend PRD. Examples:
- Auth: POST /auth/register, GET /auth/current-user.
- Projects: GET /projects/, POST /projects/.
- Tasks: POST /tasks/:projectId, PUT /tasks/:projectId/t/:taskId (with FormData for files).
- Etc.

All API calls include JWT headers; handle 401 by redirecting to login.

#### 4.5 Permission Matrix (UI Enforcement)

Mirrors backend matrix; frontend hides/disables UI elements based on role:

| Feature                    | Admin | Project Admin | Member |
| -------------------------- | ----- | ------------- | ------ |
| Create Project             | ✓     | ✗             | ✗      |
| Update/Delete Project      | ✓     | ✗             | ✗      |
| Manage Project Members     | ✓     | ✗             | ✗      |
| Create/Update/Delete Tasks | ✓     | ✓             | ✗      |
| View Tasks                 | ✓     | ✓             | ✓      |
| Update Subtask Status      | ✓     | ✓             | ✓      |
| Create/Delete Subtasks     | ✓     | ✓             | ✗      |
| Create/Update/Delete Notes | ✓     | ✗             | ✗      |
| View Notes                 | ✓     | ✓             | ✓      |

#### 4.6 User Flows

- **Onboarding:** Register → Verify Email → Login → Dashboard.
- **Project Creation:** Dashboard → Create Project (admin) → Redirect to details.
- **Task Management:** Project Details → Tasks Tab → Create Task → Add Subtasks/Files.
- **Collaboration:** Member logs in → Views project → Updates subtask status.

#### 4.7 Design Guidelines

- **Theme:** Primary #4CAF50 (green), Secondary #2196F3 (blue), Background #F5F5F5.
- **Responsive:** Mobile-first; use MUI Grid for layouts.
- **Accessibility:** WCAG 2.1 compliant (contrast, alt texts, keyboard focus).
- **Performance:** Lazy loading for components, code splitting.

#### 4.8 Data Models (Frontend State)

Align with backend:
- **User:** { id, name, email, role }
- **Project:** { id, name, description, members: [] }
- **Task:** { id, title, description, assignee, status, files: [], subtasks: [] }
- **Subtask:** { id, title, completed }
- **Note:** { id, content }
- **Roles:** 'admin', 'project_admin', 'member'
- **Statuses:** 'todo', 'in_progress', 'done'

### 5. Security Features

- JWT storage in localStorage (or HttpOnly cookies if configured).
- Role guards on routes/components.
- Input sanitization/validation.
- CORS handled via backend config.
- No sensitive data in frontend logs.

### 6. File Management

- Upload multiple files to tasks via FormData.
- Preview images/documents in UI.
- Download links for attached files.

### 7. Success Criteria

- Intuitive UI matching backend features.
- Responsive across devices (desktop, tablet, mobile).
- Secure auth and role enforcement.
- Comprehensive coverage of all backend APIs.
- High performance (load times <2s).
- Positive user feedback on usability.
- Complete documentation in code (JSDoc) and this PRD.