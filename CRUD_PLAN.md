# CRUD Implementation Plan – Safe Harbor

This document outlines the plan for implementing CRUD functionality for the Safe Harbor application.

## Overview

Currently the site consists mostly of frontend structure and placeholder backend controllers. To support future functionality (such as journaling or mood tracking), we will implement CRUD operations for a data object.

For this project, the chosen entity will be **JournalEntry**.

CRUD stands for:

- Create
- Read
- Update
- Delete

These operations will allow users to store and manage their entries.

---

## Step 1 – Create a Model

A new folder will be created in the backend:

server/Models

Inside this folder we will add:

JournalEntry.cs

Example structure:

- Id
- Nickname
- EntryText
- CreatedAt

This model represents a single journal entry in the system.

---

## Step 2 – Create a Controller

A new controller will be added in:

server/Controllers

File:

JournalEntryController.cs

This controller will expose API endpoints for CRUD operations.

---

## Step 3 – Implement CRUD Endpoints

The following endpoints will be implemented:

GET /api/journalentry  
Returns all entries

GET /api/journalentry/{id}  
Returns a single entry

POST /api/journalentry  
Creates a new entry

PUT /api/journalentry/{id}  
Updates an entry

DELETE /api/journalentry/{id}  
Deletes an entry

Initially these operations may use an in-memory list before connecting to a database.

---

## Step 4 – Connect to Frontend

Once the API is working, the React frontend will be updated to:

- display entries
- allow users to submit new entries
- allow editing and deletion

---

## Future Improvements

- connect to a persistent database
- add authentication
- validate user input
- add entry history visualization