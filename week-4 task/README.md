# WNS Internship Tasks — Week 4

Welcome to the **Week 4 Internship Project: Full-Stack AI Assistant Web Application**.

All primary project artifacts, documentation, backend services, frontend applications, and verification captures are located in the [`Week-4/`](Week-4/) directory.

---

## Quick Navigation

- 📄 **Main Technical Documentation:** [`Week-4/README.md`](Week-4/README.md)
- 📝 **Formal Internship Learning Report:** [`Week-4/Documentation/`](Week-4/Documentation/)
- ⚙️ **Flask Backend API:** [`Week-4/Development/backend/`](Week-4/Development/backend/)
- 💻 **Angular AI Assistant UI:** [`Week-4/Development/frontend/ai-assistant/`](Week-4/Development/frontend/ai-assistant/)
- 📸 **Implementation Screenshots:** [`Week-4/Screenshots/`](Week-4/Screenshots/)

---

## Executive Summary

The project implements a complete, production-ready AI Assistant platform featuring:
- **Backend:** Modular Python 3.11 + Flask REST API with PyMongo, salted `scrypt` password hashing, stateless JWT authentication (`HS256`), and server-side token revocation via MongoDB TTL indexes.
- **AI Inference Engine:** Groq Cloud LPU™ inference engine (`llama-3.3-70b-versatile`) integrated via the official OpenAI Python SDK interface.
- **Frontend:** Angular 21 Standalone Component architecture styled with a minimalist dark chatbot design inspired by ChatGPT and Claude, featuring Markdown rendering, Prism.js syntax highlighting, LaTeX math, and clipboard actions.
- **Testing:** 17 backend Pytest automated tests (all passed) + 27 frontend Vitest unit tests across 5 test suites (all passed).

For complete installation instructions, API endpoint documentation, Mermaid architecture diagrams, and verified screenshots, please refer to the comprehensive [**Week 4 Project README**](Week-4/README.md).
