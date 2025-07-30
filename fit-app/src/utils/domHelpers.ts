// Utility functions for safe DOM manipulation

export function safeAddEventListener(
  selector: string,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): () => void {
  // Wait for DOM to be ready
  const addListener = () => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (element && !element.hasAttribute('data-listener-added')) {
        element.addEventListener(event, handler, options);
        element.setAttribute('data-listener-added', 'true');
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addListener);
  } else {
    addListener();
  }

  // Return cleanup function
  return () => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (element) {
        element.removeEventListener(event, handler);
        element.removeAttribute('data-listener-added');
      }
    });
  };
}

export function safeQuerySelector(selector: string): HTMLElement | null {
  try {
    return document.querySelector(selector);
  } catch (error) {
    console.warn('Failed to query selector:', selector, error);
    return null;
  }
}

export function waitForElement(selector: string, timeout = 5000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const element = safeQuerySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = safeQuerySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}