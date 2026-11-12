import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());

// jsdom does not implement these; the questionnaire scrolls to the first error / next step.
Element.prototype.scrollIntoView = () => undefined;
window.requestAnimationFrame = (cb: FrameRequestCallback) => {
  cb(0);
  return 0;
};
