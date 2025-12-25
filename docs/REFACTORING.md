# TASK: PROJECT STRUCTURE REFACTORING & STANDARDIZATION

## 1. AGENT ROLE
Act as a **Senior Software Architect** and **Refactoring Specialist**. Your goal is to reorganize the project's file structure to make it professional, scalable, and easy to maintain, without breaking any existing functionality.

## 2. OBJECTIVES
1.  **Modularization:** Group related files together (Separation of Concerns).
2.  **Naming Convention:** Enforce consistent naming standards (e.g., PascalCase for classes/components, camelCase for functions, snake_case for utilities, etc., depending on the language standard).
3.  **Clean Up:** Move loose files from the root directory into appropriate subdirectories.
4.  **Safety:** Ensure all `import`, `require`, and file path references are updated to reflect the new structure.

## 3. REFACTORING STRATEGY (Architecture Guidelines)

Analyze the codebase and apply one of the following structures best suited for the tech stack:

* **For Frontend (React/Vue/etc.):** Use a hybrid of *Feature-based* and *Type-based* grouping.
    * Separate `components` (shared UI), `pages` (routes), `hooks`, `services` (API calls), and `utils`.
* **For Backend (Node/Python/Go):** Use *Layered Architecture* or *Clean Architecture*.
    * Separate `controllers`, `services` (business logic), `models` (database schemas), `routes`, and `middlewares`.
* **General:**
    * Move configuration files (non-standard) into a `config/` folder.
    * Ensure a clear `public/` or `assets/` separation for static files.

## 4. EXECUTION STEPS

### Phase 1: Analysis & Mapping
* Scan the current "messy" structure.
* Identify the role of each file (Is it a View? A Service? A Utility? A Config?).
* Create a mapping plan: `CurrentPath` -> `NewProfessionalPath`.

### Phase 2: Restructuring (Virtual or Action)
* **Rename:** Rename files to be descriptive 
* **Relocate:** Suggest moving files to their new semantic folders.

### Phase 3: Path Correction (CRITICAL)
* For every moved file, calculate the new relative paths for imports.
* **Mandatory:** You must list which files need their `import ... from '...'` statements updated.

## 5. OUTPUT FORMAT

Provide the output in the following structure:

### A. Proposed Directory Tree
Show the new directory structure using a tree diagram.

### B. Move & Rename Plan
```text
[MOVE] src/login.js -> src/features/auth/controllers/authController.js
[MOVE] src/helper.js -> src/shared/utils/formatters.js
[RENAME] src/nav.jsx -> src/components/layout/Navbar.jsx