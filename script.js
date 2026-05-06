// ==================== TASK MANAGER APPLICATION ====================
// This application manages student tasks with full CRUD operations,
// localStorage persistence, filtering, search, and due date tracking.

// ==================== STATE MANAGEMENT ====================
let tasks = [];
let currentFilter = 'all';
let currentSearch = '';
let editingTaskId = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    updateStats();
    renderTasks();
    attachEventListeners();
});

// ==================== EVENT LISTENERS ====================
function attachEventListeners() {
    // Task input events
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const newTaskBtn = document.getElementById('newTaskBtn');

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    addTaskBtn.addEventListener('click', addTask);
    newTaskBtn.addEventListener('click', () => {
        taskInput.focus();
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach((b) => {
                b.classList.remove('active');
            });
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderTasks();
        });
    });

    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        renderTasks();
    });

    // Modal events
    document.getElementById('modalClose').addEventListener('click', closeEditModal);
    document.getElementById('modalCancel').addEventListener('click', closeEditModal);
    document.getElementById('modalSave').addEventListener('click', saveEditedTask);
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') closeEditModal();
    });
}

// ==================== TASK OPERATIONS ====================

/**
 * Add a new task to the list
 */
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskDate = document.getElementById('taskDate');
    const taskText = taskInput.value.trim();
    const dueDate = taskDate.value;

    if (!taskText) {
        alert('Please enter a task description');
        return;
    }

    const newTask = {
        id: Date.now(),
        text: sanitizeHTML(taskText),
        completed: false,
        dueDate: dueDate || null,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    saveTasks();
    updateStats();
    renderTasks();

    // Clear inputs
    taskInput.value = '';
    taskDate.value = '';
    taskInput.focus();
}

/**
 * Delete a task by ID
 */
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter((task) => task.id !== id);
        saveTasks();
        updateStats();
        renderTasks();
    }
}

/**
 * Toggle task completion status
 */
function toggleTaskComplete(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        updateStats();
        renderTasks();
    }
}

/**
 * Open edit modal for a specific task
 */
function openEditModal(id) {
    editingTaskId = id;
    const task = tasks.find((t) => t.id === id);
    if (task) {
        document.getElementById('editTaskInput').value = task.text;
        document.getElementById('editTaskDate').value = task.dueDate || '';
        document.getElementById('editModal').classList.add('active');
        document.getElementById('editTaskInput').focus();
    }
}

/**
 * Close the edit modal
 */
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editingTaskId = null;
}

/**
 * Save edited task
 */
function saveEditedTask() {
    if (!editingTaskId) return;

    const task = tasks.find((t) => t.id === editingTaskId);
    if (task) {
        const newText = document.getElementById('editTaskInput').value.trim();
        const newDate = document.getElementById('editTaskDate').value;

        if (!newText) {
            alert('Task description cannot be empty');
            return;
        }

        task.text = sanitizeHTML(newText);
        task.dueDate = newDate || null;
        saveTasks();
        updateStats();
        renderTasks();
        closeEditModal();
    }
}

// ==================== RENDERING FUNCTIONS ====================

/**
 * Render all tasks with applied filters and search
 */
function renderTasks() {
    const tasksContainer = document.getElementById('tasksContainer');
    tasksContainer.innerHTML = '';

    let filteredTasks = tasks.filter((task) => {
        // Apply filter
        if (currentFilter === 'completed' && !task.completed) return false;
        if (currentFilter === 'pending' && task.completed) return false;

        // Apply search
        if (
            currentSearch &&
            !task.text.toLowerCase().includes(currentSearch)
        ) {
            return false;
        }

        return true;
    });

    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-state">
                <p class="empty-icon">📝</p>
                <p class="empty-text">No tasks yet. Add one to get started!</p>
            </div>
        `;
        return;
    }

    filteredTasks.forEach((task) => {
        const taskElement = createTaskElement(task);
        tasksContainer.appendChild(taskElement);
    });
}

/**
 * Create a task element DOM node
 */
function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskItem.setAttribute('data-task-id', task.id);

    const dueDateDisplay = task.dueDate ? createDueDateDisplay(task.dueDate) : '';

    taskItem.innerHTML = `
        <input 
            type="checkbox" 
            class="task-checkbox" 
            ${task.completed ? 'checked' : ''}
            onchange="toggleTaskComplete(${task.id})"
        >
        <div class="task-content">
            <div class="task-header">
                <span class="task-text">${task.text}</span>
            </div>
            ${dueDateDisplay}
        </div>
        <div class="task-actions">
            <button 
                class="task-btn edit" 
                title="Edit task"
                onclick="openEditModal(${task.id})"
            >✏️</button>
            <button 
                class="task-btn delete" 
                title="Delete task"
                onclick="deleteTask(${task.id})"
            >🗑️</button>
        </div>
    `;

    return taskItem;
}

/**
 * Create due date display element
 */
function createDueDateDisplay(dueDate) {
    if (!dueDate) return '';

    const today = new Date().toISOString().split('T')[0];
    const isOverdue = dueDate < today;
    const isToday = dueDate === today;

    let statusClass = '';
    let dateLabel = '';

    if (isOverdue) {
        statusClass = 'overdue';
        dateLabel = '⚠️ Overdue';
    } else if (isToday) {
        statusClass = 'today';
        dateLabel = '📌 Due Today';
    } else {
        dateLabel = '📅 Due';
    }

    const formattedDate = formatDate(dueDate);
    return `<div class="task-date-display ${statusClass}">
        ${dateLabel}: ${formattedDate}
    </div>`;
}

/**
 * Format date from YYYY-MM-DD to readable format
 */
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ==================== STATISTICS ====================

/**
 * Update statistics cards
 */
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const pending = total - completed;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
}

// ==================== STORAGE FUNCTIONS ====================

/**
 * Save tasks to localStorage
 */
function saveTasks() {
    localStorage.setItem('studentTasks', JSON.stringify(tasks));
}

/**
 * Load tasks from localStorage
 */
function loadTasks() {
    const stored = localStorage.getItem('studentTasks');
    tasks = stored ? JSON.parse(stored) : [];
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Sanitize HTML to prevent XSS attacks
 */
function sanitizeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== END OF APPLICATION ====================
