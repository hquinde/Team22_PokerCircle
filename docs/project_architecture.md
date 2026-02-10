# Project Architecture – PokerCircle

## Current Backend Structure

backend/
  src/
    server.ts
  package.json
  tsconfig.json

## Planned Backend Structure

As the project grows, the backend will be organized as:

backend/
  src/
    server.ts
    routes/
    controllers/
    models/
    middleware/

## Folder Purposes

server.ts  
Main entry point. Starts the Express server and registers routes.

routes/  
Defines API endpoints.

controllers/  
Handles request and response logic.

models/  
Data structures or database logic.

middleware/  
Authentication, validation, or logging logic.

## Current Endpoints

GET /ping  
GET /api/health  

## Coding Standards

General:
- Use meaningful variable names
- Keep functions readable
- Comment complex logic

Naming:
- camelCase for variables and functions
- PascalCase for classes and interfaces

Git:
- Clear commit messages
- One feature per branch when possible
