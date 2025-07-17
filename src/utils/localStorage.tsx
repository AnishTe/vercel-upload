export const isBrowser = () => typeof window !== "undefined";

export const getLocalStorage = (key, defaultValue = null) => {
    if (!isBrowser()) return defaultValue;

    try {
        const value = localStorage.getItem(key);
        return value || defaultValue;
    } catch (error) {
        console.error("Error reading localStorage:", error);
        return defaultValue;
    }
};

export const setLocalStorage = (key, value) => {
    if (!isBrowser()) return;

    try {
        if (value === null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, value);
        }
    } catch (error) {
        console.error("Error setting localStorage:", error);
    }
};

export const removeLocalStorage = (key) => {
    if (!isBrowser()) return;

    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error("Error removing localStorage:", error);
    }
};
