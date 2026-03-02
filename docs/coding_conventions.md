# Coding Conventions

This document outlines the coding standards and best practices for the PokerCircle project. Adhering to these rules ensures codebase consistency, readability, and maintainability.

---

## 1. Naming Conventions

### Files
- **Frontend Components/Screens:** PascalCase (e.g., `LobbyScreen.tsx`, `PrimaryButton.tsx`).
- **Backend Routes/Models/Middleware:** camelCase (e.g., `auth.ts`, `userModel.ts`, `errorHandler.ts`).
- **Documentation:** snake_case (e.g., `coding_conventions.md`).

### Variables & Functions
- **Variables:** camelCase (e.g., `isLoggedIn`, `userCount`).
- **Functions:** camelCase (e.g., `fetchUserData()`, `handleSearch()`).
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`, `BASE_URL`).

### TypeScript
- **Interfaces/Types:** PascalCase (e.g., `UserSummary`, `SessionState`).
- **Enums:** PascalCase for the name, UPPER_SNAKE_CASE for members.

---

## 2. Formatting Rules

- **Indentation:** 2 spaces.
- **Quotes:** Single quotes (`'`) for strings, unless backticks are needed for templates.
- **Semicolons:** Always required.
- **Trailing Commas:** Required in multi-line objects and arrays (ES6 style).
- **Line Length:** Aim for a maximum of 100 characters.

---

## 3. TypeScript Rules

- **Type Safety:** Avoid the `any` type at all costs. Use `unknown` if the type is truly dynamic, then narrow it.
- **Interfaces vs. Types:** 
  - Use `interface` for public APIs and objects that might be extended.
  - Use `type` for unions, intersections, and simple data structures.
- **Null Handling:** Prefer optional chaining (`?.`) and nullish coalescing (`??`) over manual null checks where possible.
- **Strict Mode:** Always enable `strict: true` in `tsconfig.json`.

---

## 4. React / React Native Conventions

- **Functional Components:** Always use functional components with Hooks. No class components.
- **Styles:** Use `StyleSheet.create()` at the bottom of the component file.
- **Props:** Define props using a `Props` type at the top of the file.
- **Hooks:** 
  - Follow the "Rules of Hooks" (no hooks in loops or conditionals).
  - Extract complex logic into custom hooks (e.g., `useSocket`).

---

## 5. Backend Conventions

- **Route Naming:** Use plural nouns and kebab-case (e.g., `/api/user-profiles`, `/api/game-sessions`).
- **Error Responses:** Standardized format for errors:
  ```json
  {
    "error": "Short error code or message",
    "details": "Optional longer description"
  }
  ```
- **Logging:** Use `morgan` for request logging. Use `console.error` for caught exceptions in middleware.

---

## 6. Git Conventions

### Branch Naming
- **Features:** `feat/feature-name`
- **Bug Fixes:** `fix/bug-description`
- **Documentation:** `docs/topic-name`
- **Migration/Refactor:** `refactor/change-name`

### Commit Messages
- Use the imperative mood (e.g., "Add user search" instead of "Added user search").
- Follow the format: `type: description` (e.g., `feat: implement login logic`).

---

## 7. Concrete Examples ("Do This / Not That")

### Example 1: Type Safety
❌ **NOT THAT:**
```typescript
function processData(data: any) {
  return data.name;
}
```
✅ **DO THIS:**
```typescript
interface UserData {
  name: string;
}
function processData(data: UserData) {
  return data.name;
}
```

### Example 2: Component Structure
❌ **NOT THAT:**
```tsx
export default class MyComponent extends React.Component { ... }
```
✅ **DO THIS:**
```tsx
type Props = { title: string };
export const MyComponent: React.FC<Props> = ({ title }) => {
  return <Text>{title}</Text>;
};
```

### Example 3: Route Naming
❌ **NOT THAT:** `GET /api/get_all_users`
✅ **DO THIS:** `GET /api/users`

---

## 8. Enforcement

- **Manual Review:** All Pull Requests must be reviewed by at least one other team member to ensure adherence to these conventions.
- **Automated (Future):** We plan to integrate `ESLint` and `Prettier` into our CI/CD pipeline to automate enforcement of formatting and code quality rules.
- **Pre-commit Hooks:** Use `husky` to run linting before every commit.
