# Angular Memory Leak Lab: Root Cause, Fix, and DevTools Heap Proof

A comprehensive, beginner-friendly Angular laboratory built to demonstrate a real-world memory leak caused by global browser event listeners, explain the JavaScript garbage collection mechanics behind it, implement the Angular lifecycle cleanup fix, and prove memory reclamation using Chrome DevTools Heap Snapshots.

The complete Angular project is located in [`angular-memory-leak-demo`](./angular-memory-leak-demo).

---

## Quick Start
```bash
# Navigate to the project directory
cd angular-memory-leak-demo

# Run the automated unit tests
npm test

# Build production bundle
npm run build

# Start the application
npm start
```
Then navigate to `http://localhost:4200` in Google Chrome.

---

## Documentation Links
- [Detailed Project Guide & DevTools Instructions (README.md)](./angular-memory-leak-demo/README.md)
- [Mentor Demo Guide, 3-Minute Script & Q&A (docs/mentor-demo.md)](./angular-memory-leak-demo/docs/mentor-demo.md)
