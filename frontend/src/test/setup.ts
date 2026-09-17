import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement PointerEvent; @base-ui/react's Radio primitive
// dispatches one on click, so tests need a minimal polyfill to interact with it.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
    }
  }
  // @ts-expect-error -- test-environment polyfill, not a full PointerEvent implementation
  window.PointerEvent = PointerEventPolyfill;
}
