// TaskFlow - JavaScript Practice Dashboard
// Vanilla JavaScript with ES6+ features

// Task Manager State
let tasks = [];
let currentFilter = 'all';

// Weather State
let currentCity = 'Gwalior';

// Weather Code Mapping (Open-Meteo)
const weatherCodeMap = {
    0: { description: 'Clear sky', icon: '☀️' },
    1: { description: 'Mainly clear', icon: '🌤️' },
    2: { description: 'Partly cloudy', icon: '⛅' },
    3: { description: 'Overcast', icon: '☁️' },
    45: { description: 'Fog', icon: '🌫️' },
    48: { description: 'Depositing rime fog', icon: '🌫️' },
    51: { description: 'Light drizzle', icon: '🌦️' },
    53: { description: 'Moderate drizzle', icon: '🌦️' },
    55: { description: 'Dense drizzle', icon: '🌧️' },
    56: { description: 'Light freezing drizzle', icon: '🌧️' },
    57: { description: 'Dense freezing drizzle', icon: '🌨️' },
    61: { description: 'Slight rain', icon: '🌦️' },
    63: { description: 'Moderate rain', icon: '🌧️' },
    65: { description: 'Heavy rain', icon: '🌧️' },
    66: { description: 'Light freezing rain', icon: '🌧️' },
    67: { description: 'Heavy freezing rain', icon: '🌨️' },
    71: { description: 'Slight snow fall', icon: '❄️' },
    73: { description: 'Moderate snow fall', icon: '❄️' },
    75: { description: 'Heavy snow fall', icon: '❄️' },
    77: { description: 'Snow grains', icon: '❄️' },
    80: { description: 'Slight rain showers', icon: '🌦️' },
    81: { description: 'Moderate rain showers', icon: '🌧️' },
    82: { description: 'Violent rain showers', icon: '🌧️' },
    85: { description: 'Slight snow showers', icon: '❄️' },
    86: { description: 'Heavy snow showers', icon: '❄️' },
    95: { description: 'Thunderstorm', icon: '⛈️' },
    96: { description: 'Thunderstorm with slight hail', icon: '⛈️' },
    99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' }
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeTaskManager();
    initializeWeatherWidget();
});

// Task Manager Functions
const initializeTaskManager = () => {
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Set up event listeners
    taskForm.addEventListener('submit', handleTaskSubmit);
    filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilterChange);
    });
    
    // Load initial tasks from localStorage if available (optional enhancement)
    // For this assignment, start with empty array as specified
    renderTasks();
};

const handleTaskSubmit = (e) => {
    e.preventDefault();
    
    const taskInput = document.getElementById('taskInput');
    const formMessage = document.getElementById('formMessage');
    const taskText = taskInput.value.trim();
    
    // Clear previous message
    formMessage.textContent = '';
    formMessage.className = 'form-message';
    
    // Validate input
    if (taskText === '') {
        formMessage.textContent = 'Error: Task cannot be empty or whitespace only.';
        formMessage.className = 'form-message error';
        taskInput.focus();
        return;
    }
    
    // Add new task
    const newTask = {
        id: Date.now(), // Unique ID using timestamp
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    
    // Clear input and show success message
    taskInput.value = '';
    formMessage.textContent = 'Success: Task added successfully!';
    formMessage.className = 'form-message success';
    
    // Render updated tasks
    renderTasks();
    
    // Clear success message after 3 seconds
    setTimeout(() => {
        formMessage.textContent = '';
        formMessage.className = 'form-message';
    }, 3000);
};

const handleFilterChange = (e) => {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    
    e.target.classList.add('active');
    e.target.setAttribute('aria-pressed', 'true');
    
    // Update current filter
    currentFilter = e.target.dataset.filter;
    
    // Render tasks with new filter
    renderTasks();
};

const getFilteredTasks = () => {
    if (currentFilter === 'all') {
        return tasks;
    }
    
    if (currentFilter === 'pending') {
        return tasks.filter(task => !task.completed);
    }
    
    if (currentFilter === 'completed') {
        return tasks.filter(task => task.completed);
    }
    
    return tasks;
};

const calculateStats = () => {
    const total = tasks.length;
    const completed = tasks.reduce((count, task) => {
        return task.completed ? count + 1 : count;
    }, 0);
    const pending = total - completed;
    
    return {
        total,
        completed,
        pending
    };
};

const toggleTaskCompletion = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
    }
};

const deleteTask = (taskId) => {
    tasks = tasks.filter(t => t.id !== taskId);
    renderTasks();
};

const renderTasks = () => {
    const tasksList = document.getElementById('tasksList');
    const emptyMessage = document.getElementById('emptyMessage');
    const filteredTasks = getFilteredTasks();
    const stats = calculateStats();
    
    // Update statistics
    document.getElementById('totalTasks').textContent = stats.total;
    document.getElementById('pendingTasks').textContent = stats.pending;
    document.getElementById('completedTasks').textContent = stats.completed;
    
    // Clear current list
    tasksList.innerHTML = '';
    
    // Show empty message if no tasks
    if (filteredTasks.length === 0) {
        emptyMessage.classList.add('visible');
        return;
    }
    
    emptyMessage.classList.remove('visible');
    
    // Use map() to prepare and render task data
    const taskElements = filteredTasks.map(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        if (task.completed) {
            taskItem.classList.add('completed');
        }
        
        taskItem.innerHTML = `
            <div class="task-content">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    id="task-${task.id}"
                    ${task.completed ? 'checked' : ''}
                    aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"
                >
                <span class="task-text">${escapeHtml(task.text)}</span>
            </div>
            <div class="task-actions">
                <button 
                    type="button" 
                    class="btn btn-success"
                    data-action="toggle"
                    data-id="${task.id}"
                    aria-label="${task.completed ? 'Mark as pending' : 'Mark as completed'}"
                >
                    ${task.completed ? 'Mark as Pending' : 'Mark as Completed'}
                </button>
                <button 
                    type="button" 
                    class="btn btn-danger"
                    data-action="delete"
                    data-id="${task.id}"
                    aria-label="Delete task"
                >
                    Delete
                </button>
            </div>
        `;
        
        return taskItem;
    });
    
    // Append all task elements
    taskElements.forEach(element => {
        tasksList.appendChild(element);
    });
    
    // Add event listeners to task buttons
    tasksList.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const taskId = parseInt(e.target.dataset.id);
            
            if (action === 'toggle') {
                toggleTaskCompletion(taskId);
            } else if (action === 'delete') {
                deleteTask(taskId);
            }
        });
    });
    
    // Add event listeners to checkboxes
    tasksList.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const taskId = parseInt(e.target.id.replace('task-', ''));
            toggleTaskCompletion(taskId);
        });
    });
};

// Helper function to escape HTML and prevent XSS
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// Weather Widget Functions
const initializeWeatherWidget = () => {
    const searchBtn = document.getElementById('searchBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const cityInput = document.getElementById('cityInput');
    
    searchBtn.addEventListener('click', handleWeatherSearch);
    refreshBtn.addEventListener('click', handleWeatherRefresh);
    
    // Allow Enter key to search
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleWeatherSearch();
        }
    });
    
    // Fetch weather for default city on load
    fetchWeather('Gwalior');
};

const handleWeatherSearch = () => {
    const cityInput = document.getElementById('cityInput');
    const city = cityInput.value.trim();
    
    if (city === '') {
        showWeatherMessage('Error: Please enter a city name.', 'error');
        cityInput.focus();
        return;
    }
    
    fetchWeather(city);
};

const handleWeatherRefresh = () => {
    fetchWeather(currentCity);
};

const fetchWeather = async (city) => {
    const weatherMessage = document.getElementById('weatherMessage');
    const weatherContent = document.getElementById('weatherContent');
    
    // Show loading state
    weatherMessage.textContent = 'Loading weather data...';
    weatherMessage.className = 'weather-message loading';
    weatherContent.classList.remove('visible');
    
    try {
        // Step 1: Get coordinates using Geocoding API
        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
        );
        
        if (!geoResponse.ok) {
            throw new Error('Geocoding API request failed');
        }
        
        const geoData = await geoResponse.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(`City "${city}" not found`);
        }
        
        const location = geoData.results[0];
        const { latitude, longitude, name, country, admin1 } = location;
        
        // Update current city name for display
        currentCity = name;
        if (admin1 && admin1 !== name) {
            currentCity = `${name}, ${admin1}`;
        }
        if (country) {
            // For international cities, show country; for Indian cities also admin1 is useful
            // But keep it simple and informative
        }
        
        // Step 2: Fetch weather using coordinates
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`
        );
        
        if (!weatherResponse.ok) {
            throw new Error('Weather API request failed');
        }
        
        const weatherData = await weatherResponse.json();
        
        if (!weatherData.current) {
            throw new Error('Weather data not available');
        }
        
        // Step 3: Display weather data
        displayWeather(currentCity, weatherData.current);
        
        // Show success message
        weatherMessage.textContent = '';
        weatherMessage.className = 'weather-message';
        weatherContent.classList.add('visible');
        
    } catch (error) {
        console.error('Weather fetch error:', error);
        let errorMessage = 'Error: Failed to fetch weather data.';
        
        if (error.message.includes('not found')) {
            errorMessage = `Error: City "${city}" not found. Please check the spelling and try again.`;
        } else if (error.message.includes('API request failed')) {
            errorMessage = 'Error: Weather API request failed. Please check your internet connection and try again.';
        }
        
        showWeatherMessage(errorMessage, 'error');
    }
};

const displayWeather = (cityName, currentWeather) => {
    const {
        temperature_2m: temp,
        relative_humidity_2m: humidity,
        apparent_temperature: feelsLike,
        weather_code: weatherCode,
        wind_speed_10m: windSpeed
    } = currentWeather;
    
    // Get weather info from code
    const weatherInfo = weatherCodeMap[weatherCode] || { 
        description: 'Unknown', 
        icon: '❓' 
    };
    
    // Update DOM elements
    document.getElementById('weatherCity').textContent = cityName;
    document.getElementById('weatherIcon').textContent = weatherInfo.icon;
    document.getElementById('weatherIcon').setAttribute('aria-label', weatherInfo.description);
    document.getElementById('tempValue').textContent = Math.round(temp);
    document.getElementById('weatherCondition').textContent = weatherInfo.description;
    document.getElementById('feelsLike').textContent = Math.round(feelsLike);
    document.getElementById('humidity').textContent = Math.round(humidity);
    document.getElementById('windSpeed').textContent = Math.round(windSpeed * 10) / 10; // Round to 1 decimal
};

const showWeatherMessage = (message, type) => {
    const weatherMessage = document.getElementById('weatherMessage');
    const weatherContent = document.getElementById('weatherContent');
    
    weatherMessage.textContent = message;
    weatherMessage.className = `weather-message ${type}`;
    weatherContent.classList.remove('visible');
};