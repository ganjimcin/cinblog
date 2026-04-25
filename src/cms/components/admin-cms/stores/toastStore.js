import { writable } from 'svelte/store';

// We'll use a simple writable store for toasts to ensure compatibility across components
export const toasts = writable([]);

export const toastStore = {
  add: (message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts.update(all => [{ id, message, type }, ...all]);
    
    if (duration) {
      setTimeout(() => {
        toastStore.remove(id);
      }, duration);
    }
    return id;
  },
  remove: (id) => {
    toasts.update(all => all.filter(t => t.id !== id));
  },
  success: (msg, dur) => toastStore.add(msg, 'success', dur),
  error: (msg, dur) => toastStore.add(msg, 'error', dur),
  info: (msg, dur) => toastStore.add(msg, 'info', dur),
  warning: (msg, dur) => toastStore.add(msg, 'warning', dur)
};
