# TaskFlow - JavaScript Practice Dashboard

## Project Overview

TaskFlow is a complete, clean, and responsive web application designed to demonstrate Week 2 web development tasks during an internship. Built using only HTML, CSS, and vanilla JavaScript, it combines a task management system with a live weather widget, showcasing core JavaScript concepts including DOM manipulation, event handling, ES6+ features, and API integration.

## Features

### Task Manager
- **Add Tasks**: Easily add new tasks using the form with input validation
- **Task Completion**: Mark tasks as completed or pending with checkboxes and action buttons
- **Delete Tasks**: Remove tasks you no longer need
- **Task Filtering**: View tasks by All, Pending, or Completed status
- **Real-time Statistics**: Track Total, Pending, and Completed task counts
- **Empty State**: Helpful message when no tasks are present
- **Form Validation**: Prevents empty or whitespace-only tasks with clear error/success messages
- **Keyboard Support**: Full keyboard interaction support

### Live Weather API Widget
- **Real-time Weather Data**: Fetches current weather from the Open-Meteo API (no API key required)
- **City Search**: Search for any city worldwide with geocoding support
- **Default City**: Loads Gwalior weather on page load
- **Comprehensive Weather Info**: Displays city name, temperature (°C), feels-like temperature, weather condition, humidity (%), and wind speed (m/s)
- **Weather Icons & Descriptions**: Translates Open-Meteo weather codes into readable descriptions with appropriate emojis
- **Loading States**: Shows loading indicator while fetching data
- **Error Handling**: Clear error messages for city not found or API failures
- **Refresh Button**: Fetch updated weather data on demand
- **Live API Integration**: Uses real API responses via `fetch()`, `async/await`, and `try/catch`

### Design & Responsiveness
- **Modern UI**: Clean light theme with subtle shadows, rounded corners, and polished cards
- **Responsive Layout**: Stacks vertically on mobile devices, side-by-side on desktop
- **Professional Typography**: Uses Inter font family for improved readability
- **Accessibility**: Semantic HTML, proper ARIA labels, and keyboard navigation support

## Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with CSS variables, Flexbox, and Grid
- **Vanilla JavaScript (ES6+)**: 
  - `const` and `let` for variable declarations
  - Arrow functions (`() => {}`)
  - Template literals (`` `${}` ``)
  - Array methods: `map()`, `filter()`, and `reduce()`
  - `async/await` for asynchronous operations
  - `fetch()` for API requests
  - `try/catch` for error handling
  - Event listeners for DOM interactions

## Weather API Integration

This project integrates with the **Open-Meteo API**, a free, open-source weather API that requires no API key.

### Endpoints Used

1. **Geocoding API** - Used to convert city names to coordinates
   ```
   https://geocoding-api.open-meteo.com/v1/search?name=CITY_NAME&count=1
   ```
   - `name`: City name to search for
   - `count`: Number of results to return (set to 1)

2. **Weather Forecast API** - Used to fetch current weather data
   ```
   https://api.open-meteo.com/v1/forecast?latitude=LATITUDE&longitude=LONGITUDE&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto
   ```
   - `latitude`, `longitude`: Coordinates from geocoding
   - `current`: Requested weather parameters
   - `timezone=auto`: Automatically detects timezone

### Weather Data Retrieved
- Temperature at 2m (`temperature_2m`) in °C
- Feels-like temperature (`apparent_temperature`) in °C
- Relative humidity (`relative_humidity_2m`) in %
- Weather code (`weather_code`) for condition mapping
- Wind speed at 10m (`wind_speed_10m`) in m/s

### Weather Code Mapping
The application translates Open-Meteo's numeric weather codes into human-readable descriptions and emojis (Clear sky, Partly cloudy, Fog, Rain, Snow, Thunderstorm, etc.).

## Instructions to Run the Website Locally

1. **Clone or Download**: Download this project folder to your local machine
2. **Navigate to the Project**: Open the `week-2-website` folder
3. **Open in Browser**: 
   - Double-click `index.html` to open it directly in your default browser
   - OR use a local development server (recommended for API requests):
     - Using VS Code: Install "Live Server" extension → Right-click `index.html` → "Open with Live Server"
     - Using Python: `python -m http.server 8000` in the project directory → Open `http://localhost:8000`
     - Using Node.js: `npx serve` in the project directory
4. **Start Using**: The website will load with the default city (Gwalior) weather and an empty task list

**Note**: For the Live Weather API to work properly, it's recommended to run the website through a local development server rather than opening the file directly (due to CORS restrictions in some browsers).

## Week 2 Internship Tasks Mapping

This project fulfills the following Week 2 learning objectives:

| Project Feature | Week 2 Task | Implementation |
|---|---|---|
| **HTML Structure** | Semantic HTML & Layout Design | Proper HTML5 structure with semantic elements (`header`, `main`, `section`, `aside`), forms with labels, and accessibility attributes (ARIA) |
| **CSS Styling** | Responsive Design & Modern UI | CSS Grid/Flexbox for layout, CSS variables for theming, media queries for mobile responsiveness, clean styling with shadows and rounded cards |
| **DOM Manipulation** | JavaScript Interactivity | Dynamic task rendering, real-time statistics updates, filter switching, and UI updates based on state |
| **Event Handling** | Form Handling & User Interactions | Event listeners for form submission, button clicks, checkboxes, keyboard events (Enter key), and filter buttons |
| **Form Validation** | Input Validation | Prevents submission of empty/whitespace tasks, displays clear success/error messages, prevents page reload with `event.preventDefault()` |
| **ES6+ Features** | Modern JavaScript | Used `const`, `let`, arrow functions, template literals throughout the codebase |
| **Array Methods** | Data Transformation | `map()` to prepare task elements for display, `filter()` to apply All/Pending/Completed filters, `reduce()` to calculate task statistics |
| **API Integration** | Fetch API & Asynchronous JS | Implemented `fetch()` with `async/await`, proper error handling with `try/catch` for Open-Meteo Geocoding and Weather APIs |
| **Error Handling** | Robust Application Design | Loading indicators, user-friendly error messages for invalid cities, API failures, and network issues |
| **Code Organization** | Modular & Readable Code | Separated concerns into functions, meaningful variable names, helper functions, comments kept minimal per requirements |
| **Responsive Design** | Mobile-First Approach | Grid layout stacks vertically on mobile (< 968px), form elements adapt to screen size, optimized spacing |
| **Data Flow** | State Management | Managed task state with arrays, filter state with variables, weather state with current city tracking |

## Testing Checklist

- [x] Add tasks with valid input
- [x] Prevent empty/whitespace task submission
- [x] Mark tasks as complete/pending using checkboxes and buttons
- [x] Delete tasks
- [x] Filter tasks by All/Pending/Completed
- [x] Task statistics update correctly
- [x] Empty state message displays appropriately
- [x] Weather loads for default city (Gwalior)
- [x] City search works with valid city names
- [x] Error handling for invalid city names
- [x] Refresh button fetches updated weather
- [x] Loading indicator displays during API calls
- [x] Responsive layout works on desktop and mobile
- [x] No page reload on form submissions
- [x] Keyboard navigation works properly
- [x] Real API responses are used (no hardcoded/mock data)

## Final Notes

- **No external libraries**: This project uses only vanilla HTML, CSS, and JavaScript as required
- **No backend or authentication**: Pure client-side application
- **Beginner-friendly**: Code is clean, well-structured, and easy to explain
- **Production-ready for demo**: Fully functional with proper error handling and edge cases covered
- **No TODOs or placeholders**: All features are complete and working as specified

--- 

**Built for Week 2 Web Development Internship Tasks**