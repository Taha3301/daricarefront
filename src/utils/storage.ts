export const storage = {
    getItem: (key: string) => localStorage.getItem(key) || sessionStorage.getItem(key),
    setItem: (key: string, value: string, persistent: boolean = true) => {
        if (persistent) {
            localStorage.setItem(key, value);
        } else {
            sessionStorage.setItem(key, value);
        }
    },
    removeItem: (key: string) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    },
    clear: () => {
        localStorage.clear();
        sessionStorage.clear();
    }
};
