# 🚀 Team Task Manager

A premium, full-stack Role-Based Access Control (RBAC) web application designed for seamless team collaboration and project management. Built with modern web technologies, this application offers an intuitive Kanban-style interface, dynamic data visualization, and strict authorization protocols.

---

## 🌟 Key Features

### 🔐 Role-Based Access Control (RBAC)
The system strictly enforces permissions at both the API and UI levels using JWT-based authentication.
*   **Global Admin:** The first registered user is automatically elevated to Global Admin. Admins have exclusive rights to create new projects.
*   **Project Admin:** The creator of a project automatically becomes its Admin, granting them the ability to invite team members, remove tasks, and manage the project workspace.
*   **Member:** Standard users who can only view tasks explicitly assigned to them within their respective projects. They can update the status of their own tasks but are blocked from editing other users' assignments.

### 📋 Interactive Kanban Board
A highly responsive drag-and-drop Kanban board powers the core task management experience.
*   **Dynamic Columns:** Tasks are organized into "To Do", "In Progress", and "Done".
*   **Real-Time Sync:** Dragging a card instantly updates the backend database via optimistic UI rendering for zero-latency feedback.
*   **Live Search:** Instantly filter tasks on the board using the integrated search bar without reloading the page.

### ⚡ Premium Enhancements
*   **Priority System:** Tasks can be flagged as `High 🔴`, `Medium 🟡`, or `Low 🟢` with dynamic color-coded badges.
*   **Automated Overdue Alerts:** The system actively monitors due dates. If a task misses its deadline, its timestamp turns bold red and pulses, immediately alerting the team.
*   **Sleek UI/UX:** Features a professional aesthetic with glassmorphism elements, micro-animations, and a dedicated "Role Toggle Switch" on the login screen for an enhanced user experience.

### 📊 Insightful Dashboard
*   **Data Visualization:** Integrates `Chart.js` to provide beautiful Pie and Bar charts breaking down project metrics.
*   **Real-time Calculations:** Automatically calculates and displays total tasks, pending tasks, and overdue tasks based on the authenticated user's permissions.

---

## 🏗️ Architecture & Technology Stack

The application is built on a decoupled Client-Server architecture, ensuring scalability and maintainability.

### Frontend (Client)
*   **Framework:** React 18 (Bootstrapped with Vite for lightning-fast HMR)
*   **Routing:** React Router v6
*   **Styling:** Tailwind CSS (Utility-first styling for custom, responsive design)
*   **Drag & Drop:** `@hello-pangea/dnd` (Optimized Kanban functionality)
*   **Data Fetching & State:** Axios with interceptors for seamless JWT token injection. React Context API for global authentication state.

### Backend (Server)
*   **Framework:** FastAPI (Python 3.11+) - chosen for its immense speed and automatic OpenAPI documentation.
*   **ORM:** SQLAlchemy 2.0+ (Handles complex table joins for RBAC checks)
*   **Database:** PostgreSQL (Relational integrity for complex User ↔ Project ↔ Task relationships)
*   **Security:** `passlib` (Bcrypt password hashing) and `python-jose` (JWT encoding/decoding).

---

## 🗄️ Database Schema Mapping

The relational database is structured to securely isolate data based on project membership:
1.  **Users:** Stores credentials, global roles, and profile information.
2.  **Projects:** Represents the workspace.
3.  **ProjectMembers:** A junction table linking `Users` to `Projects`, storing their specific `ProjectRole` (Admin vs. Member).
4.  **Tasks:** Stores task metadata (`priority`, `status`, `due_date`) and relies on Foreign Keys linking back to the Project and the Assigned User.

---

## 🛠️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Python (3.9+)
*   PostgreSQL installed and running locally.

### 1. Database Setup
Ensure PostgreSQL is running. Create a database named `taskmanager`.
```sql
CREATE DATABASE taskmanager;
```

### 2. Backend Initialization
Navigate to the backend directory, create a virtual environment, and install dependencies:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@localhost/taskmanager
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Start the FastAPI server:
```bash
uvicorn app.main:app --reload
```
*(The backend will run on `http://localhost:8000`)*

### 3. Frontend Initialization
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*(The frontend will run on `http://localhost:5173`)*

---

## 🚦 Usage Workflow

1.  **System Initialization:** The first person to register an account becomes the **Global Admin**.
2.  **Workspace Creation:** The Global Admin logs in, navigates to the "Projects" tab, and creates a new project workspace.
3.  **Team Onboarding:** The Admin clicks into the project, uses the "Add Member" feature, and enters the email addresses of their team to invite them.
4.  **Task Delegation:** The Admin creates tasks, sets due dates and priorities, and assigns them to specific team members.
5.  **Execution:** Members log in, view only their assigned tasks on the Kanban board, and drag them into the "Done" column as work is completed.

---

*Built with passion and a focus on premium aesthetics and secure architecture.*
