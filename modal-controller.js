(function (root, factory) {
  const createModalController = factory();
  if (typeof module === 'object' && module.exports) module.exports = { createModalController };
  if (root?.document) root.appModal = createModalController(root.document);
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function createModalController(document) {
    const overlay = document.getElementById('appModal');
    const form = document.getElementById('appModalForm');
    const title = document.getElementById('appModalTitle');
    const description = document.getElementById('appModalDescription');
    const icon = document.getElementById('appModalIcon');
    const field = document.getElementById('appModalField');
    const label = document.getElementById('appModalLabel');
    const input = document.getElementById('appModalInput');
    const error = document.getElementById('appModalError');
    const cancel = document.getElementById('appModalCancel');
    const submit = document.getElementById('appModalSubmit');
    let active = null;

    const focusable = () => [...overlay.querySelectorAll('button:not([disabled]), input:not([disabled])')]
      .filter(element => !element.hidden && !element.closest('[hidden]'));
    function finish(result) {
      if (!active) return;
      const { resolve, previousFocus } = active;
      active = null;
      overlay.hidden = true;
      form.reset();
      previousFocus?.focus?.();
      resolve(result);
    }
    async function submitResult(event) {
      event.preventDefault();
      if (!active || active.busy) return;
      const value = active.hasInput ? input.value : undefined;
      if (active.required && !value.trim()) {
        error.textContent = active.requiredMessage || 'This field is required.';
        error.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      error.hidden = true;
      input.removeAttribute('aria-invalid');
      if (active.onConfirm) {
        active.busy = true;
        submit.disabled = cancel.disabled = true;
        const oldText = submit.textContent;
        submit.textContent = active.pendingLabel || 'Working…';
        try {
          await active.onConfirm(value);
        } catch (reason) {
          active.busy = false;
          submit.disabled = cancel.disabled = false;
          submit.textContent = oldText;
          error.textContent = reason?.message || active.failureMessage || 'Something went wrong. Please try again.';
          error.hidden = false;
          return;
        }
      }
      finish({ confirmed: true, value });
    }
    form.addEventListener('submit', submitResult);
    cancel.addEventListener('click', () => finish({ confirmed: false, value: null }));
    overlay.addEventListener('keydown', event => {
      if (!active) return;
      if (event.key === 'Escape' && active.cancelable && !active.busy) {
        event.preventDefault();
        finish({ confirmed: false, value: null });
      }
      if (event.key === 'Tab') {
        const items = focusable();
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });

    function open(options = {}) {
      if (active) return Promise.reject(new Error('A modal is already open'));
      title.textContent = options.title || 'Gathered';
      description.textContent = options.message || '';
      icon.textContent = options.kind === 'error' ? '!' : options.kind === 'confirm' ? '?' : 'i';
      overlay.dataset.kind = options.kind || 'info';
      const hasInput = options.inputType === 'text' || options.inputType === 'password';
      field.hidden = !hasInput;
      input.type = options.inputType || 'text';
      input.value = options.value || '';
      input.autocomplete = options.inputType === 'password' ? 'current-password' : 'off';
      label.textContent = options.label || 'Response';
      cancel.hidden = options.cancelable === false;
      cancel.textContent = options.cancelLabel || 'Cancel';
      submit.textContent = options.confirmLabel || 'OK';
      submit.className = `btn ${options.destructive ? 'danger' : 'primary'}`;
      submit.disabled = cancel.disabled = false;
      error.hidden = true;
      input.removeAttribute('aria-invalid');
      overlay.hidden = false;
      return new Promise(resolve => {
        active = { ...options, hasInput, cancelable: options.cancelable !== false, busy: false,
          previousFocus: document.activeElement, resolve };
        setTimeout(() => (hasInput ? input : submit).focus(), 0);
      });
    }
    return {
      open,
      confirm: (message, options = {}) => open({ ...options, kind: 'confirm', message }),
      input: (message, options = {}) => open({ ...options, inputType: 'text', message }),
      password: (message, options = {}) => open({ ...options, inputType: 'password', message }),
      message: (message, options = {}) => open({ ...options, cancelable: false, message }),
      error: (message, options = {}) => open({ ...options, kind: 'error', cancelable: false, message })
    };
  }
  return createModalController;
});
