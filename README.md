# Join 📋

A Kanban-inspired task management web app built with vanilla JavaScript and Firebase. Create tasks, organize them across columns with drag & drop, manage contacts, and collaborate — all in one place.

🔗 **[Live Demo](https://join.dieter-foos.de)**

---

## Features

- **Kanban Board** with four columns: To do · In progress · Await feedback · Done
- **Drag & drop** to move tasks between columns
- **Add Task** with title, description, due date, priority, category, assigned contacts and subtasks
- **Task detail overlay** — view, edit or delete any task
- **Subtask tracking** with checkbox progress
- **Contact management** — create, edit and delete contacts
- **Summary dashboard** — overview of task counts and urgent deadlines
- **Firebase authentication** — login, logout, guest access
- **Protected routes** — redirect to login for unauthenticated users
- **Responsive design** — works on desktop and mobile

---

## Pages

| Page | Description |
|---|---|
| `index.html` | Login / registration |
| `summary-board.html` | Dashboard overview |
| `board.html` | Kanban task board |
| `addtask.html` | Standalone add-task form |
| `contact.html` | Contact list & management |
| `help.html` | Help & documentation |
| `legal-notice.html` / `privacy-policy.html` | Legal pages |

---

## Architecture

```
scripts/
  ├── addtask/
  │   ├── addtask.js           – Core add-task logic
  │   ├── addtask.contacts.js  – Assign contacts to tasks
  │   ├── addtask.subtasks.js  – Subtask handling
  │   ├── addtask.validation.js – Form validation
  │   ├── addtask.ui.js        – UI state & interactions
  │   ├── addtask.module.js    – Shared module helpers
  │   └── addtask.event.js     – Event bindings
  ├── board/                   – Board rendering, drag & drop, move logic
  ├── contacts/                – Contact CRUD operations
  ├── login/                   – Firebase auth & session handling
  ├── summary/                 – Dashboard data aggregation
  └── templates.js             – Shared HTML template functions
script.js                      – Global auth state, navigation, header
```

---

## Getting Started

```bash
git clone https://github.com/eisyeic/Join.git
cd Join
git checkout second
open index.html
```

Or visit the **[Live Demo](https://join.dieter-foos.de)**.

> **Note:** Firebase credentials are required for full functionality. The live demo is fully configured.

---

## Technologies

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)

---

## Authors

**Dieter Foos** — [Portfolio](https://dieter-foos.de) · [GitHub](https://github.com/dfo81) · [LinkedIn](https://www.linkedin.com/in/dieter-foos-7a13a63ba/)
