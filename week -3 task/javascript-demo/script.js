/**
 * JavaScript & Flask Direct Integration Demo
 * 
 * Demonstrates:
 * 1. Native fetch() GET requests with async/await.
 * 2. Native fetch() POST requests sending JSON headers and body.
 * 3. Asynchronous loading state toggling (spinners, disabled buttons).
 * 4. Comprehensive error handling (HTTP error codes vs Network failures).
 * 5. Rendering JSON payloads and human-readable feedback.
 */

// Configuration: Backend API Base URL
const API_BASE_URL = 'http://127.0.0.1:5000';

// DOM Element References
const btnHealth = document.getElementById('btnHealth');
const btnHello = document.getElementById('btnHello');
const btnGreet = document.getElementById('btnGreet');
const btnGreetClear = document.getElementById('btnGreetClear');
const nameInput = document.getElementById('nameInput');

const healthResult = document.getElementById('healthResult');
const helloResult = document.getElementById('helloResult');
const greetResult = document.getElementById('greetResult');

const spinnerHealth = document.getElementById('spinnerHealth');
const spinnerHello = document.getElementById('spinnerHello');
const spinnerGreet = document.getElementById('spinnerGreet');

/**
 * Utility: Set loading state for a button and spinner
 * @param {HTMLButtonElement} button 
 * @param {HTMLElement} spinner 
 * @param {boolean} isLoading 
 */
function setLoading(button, spinner, isLoading) {
  if (isLoading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

/**
 * Utility: Render a formatted result inside a target element
 * @param {HTMLElement} container - DOM container element
 * @param {boolean} isSuccess - Whether the call succeeded
 * @param {string} statusText - Short descriptive status
 * @param {any} data - Parsed response or error details
 */
function renderResult(container, isSuccess, statusText, data) {
  container.classList.remove('hidden', 'success', 'error');
  container.classList.add(isSuccess ? 'success' : 'error');

  const icon = isSuccess ? '&#10004;' : '&#10008;';
  const jsonPretty = JSON.stringify(data, null, 2);

  container.innerHTML = `
    <div class="result-status">
      <span>${icon}</span>
      <span>${statusText}</span>
    </div>
    <pre class="result-json">${jsonPretty}</pre>
  `;
}

/**
 * 1. Health Check (GET /health)
 */
async function fetchHealth() {
  setLoading(btnHealth, spinnerHealth, true);
  const startTime = performance.now();

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const elapsed = Math.round(performance.now() - startTime);
    const data = await response.json();

    if (response.ok) {
      renderResult(
        healthResult, 
        true, 
        `Backend Online (HTTP ${response.status} OK in ${elapsed}ms)`, 
        data
      );
    } else {
      renderResult(
        healthResult, 
        false, 
        `Backend Error (HTTP ${response.status})`, 
        data
      );
    }
  } catch (error) {
    renderResult(
      healthResult, 
      false, 
      'Network Error: Unable to reach Flask backend', 
      {
        message: error.message,
        suggestion: 'Make sure your Flask server is running at http://127.0.0.1:5000'
      }
    );
  } finally {
    setLoading(btnHealth, spinnerHealth, false);
  }
}

/**
 * 2. Hello API (GET /hello)
 */
async function fetchHello() {
  setLoading(btnHello, spinnerHello, true);
  const startTime = performance.now();

  try {
    const response = await fetch(`${API_BASE_URL}/hello`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const elapsed = Math.round(performance.now() - startTime);
    const data = await response.json();

    if (response.ok) {
      renderResult(
        helloResult, 
        true, 
        `Success (HTTP ${response.status} in ${elapsed}ms)`, 
        data
      );
    } else {
      renderResult(
        helloResult, 
        false, 
        `HTTP Error ${response.status}`, 
        data
      );
    }
  } catch (error) {
    renderResult(
      helloResult, 
      false, 
      'Connection Failed', 
      {
        error: error.message,
        hint: 'Verify that the Flask server is running and CORS is enabled.'
      }
    );
  } finally {
    setLoading(btnHello, spinnerHello, false);
  }
}

/**
 * 3. Greeting API (POST /greet)
 */
async function sendGreeting() {
  const name = nameInput.value;
  setLoading(btnGreet, spinnerGreet, true);
  const startTime = performance.now();

  try {
    const response = await fetch(`${API_BASE_URL}/greet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name: name })
    });

    const elapsed = Math.round(performance.now() - startTime);
    const data = await response.json();

    if (response.ok) {
      renderResult(
        greetResult, 
        true, 
        `Greeting Received (HTTP ${response.status} in ${elapsed}ms)`, 
        data
      );
    } else {
      // Backend returned 400 Bad Request (validation failure)
      renderResult(
        greetResult, 
        false, 
        `Validation Failed (HTTP ${response.status})`, 
        data
      );
    }
  } catch (error) {
    renderResult(
      greetResult, 
      false, 
      'Network / CORS Error', 
      {
        error: error.message,
        hint: 'Check if Flask is active on port 5000 and allows origins.'
      }
    );
  } finally {
    setLoading(btnGreet, spinnerGreet, false);
  }
}

// Event Listeners
btnHealth.addEventListener('click', fetchHealth);
btnHello.addEventListener('click', fetchHello);
btnGreet.addEventListener('click', sendGreeting);

btnGreetClear.addEventListener('click', () => {
  nameInput.value = '';
  greetResult.classList.add('hidden');
  nameInput.focus();
});

// Allow pressing 'Enter' inside the name input to submit
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendGreeting();
  }
});

// Auto-check health on initial page load
window.addEventListener('DOMContentLoaded', () => {
  fetchHealth();
});
