# Angular Frontend – Angular Flask Integration Demo

This directory contains the Angular single-page frontend application for the **Angular Flask Integration Demo**, built with Angular 21, TypeScript, Reactive Forms, and HttpClient.

---

## Features & Highlights

- **Standalone Components:** Modern architecture without `NgModule` boilerplate (`HomeComponent`, `GreetingComponent`, `AboutComponent`, `NavbarComponent`).
- **Angular Router:** Client-side routing with clean URLs:
  - `/` &ndash; Home (project overview, backend health ping, live `/hello` API test).
  - `/greet` &ndash; Reactive form greeting submission with custom non-whitespace validation, loading indicators, and error banners.
  - `/about` &ndash; Technical architecture breakdown and technology stack review.
- **Dedicated `ApiService`:** Centralizes all HTTP interactions via Angular `HttpClient` and RxJS observables.
- **Strict Typing:** All payloads are typed with TypeScript interfaces (`HealthResponse`, `HelloResponse`, `GreetRequest`, `GreetResponse`, `ApiError`).
- **Defensive Error Handling:** Detects server offline states (HTTP status `0`) and surfaces clear recovery recommendations to users.

---

## Project Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── about/          # About page component
│   │   │   ├── greeting/       # Greeting reactive form component
│   │   │   ├── home/           # Home dashboard and health monitor
│   │   │   └── navbar/         # Navigation bar with active route highlights
│   │   ├── models/
│   │   │   └── api.models.ts   # TypeScript interfaces for API payloads
│   │   ├── services/
│   │   │   └── api.service.ts  # Injected HTTP service
│   │   ├── app.config.ts       # Application providers (Router, HttpClient)
│   │   ├── app.routes.ts       # Route declarations
│   │   ├── app.ts              # Root standalone component
│   │   ├── app.html            # Main layout template
│   │   └── app.css             # Layout styles
│   ├── environments/
│   │   └── environment.ts      # API base URL configuration
│   ├── index.html              # HTML entrypoint
│   ├── main.ts                 # Bootstrap logic
│   └── styles.css              # Global styles & design tokens
├── angular.json                # Angular workspace configuration
├── package.json                # Dependencies and scripts
└── tsconfig.json               # TypeScript configuration
```

---

## Prerequisites

- Node.js 18+ or 20+ (tested on Node.js 22.17.1)
- npm 9+ (tested on npm 11.19.1)
- Angular CLI (`npm install -g @angular/cli`)

---

## Setup and Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm start
# or
ng serve --port 4200 --open
```

Once started, navigate your browser to:
```text
http://localhost:4200
```

### 3. Production Build
To create an optimized production build:
```bash
npm run build
```
Production artifacts will be generated in `dist/frontend/browser/`.
