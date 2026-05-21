// Enums for Task Status and Priority, matching backend for consistency
export const TaskStatus = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    DONE: "Done",
    BLOCKED: "Blocked",
};

export const TaskPriority = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
};

// Utility function to format dates
export const formatDate = (dateString, locale = 'en-US') => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateString; // Return original if invalid
    }
};

// Simple debounce function
export const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
};