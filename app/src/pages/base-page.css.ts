import { css } from "@microsoft/fast-element";

export const baseStyles = css`
  :host {
    display: block;
    height: 100%;
    overflow-y: auto;
  }

  .content-container {
    padding: 1.5rem;
    height: 100%;
    position: relative;
  }

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  /* Grid layout component now handles the widget positioning and sizing */
  .widgets-container {
    width: 100%;
  }

  /* Remove redundant widget size classes as they're now handled by grid-layout */

  .empty-message {
    text-align: center;
    padding: 3rem;
    color: var(--neutral-foreground-hint);
    background-color: var(--neutral-layer-2);
    border-radius: 8px;
    margin: 2rem 0;
  }

  .empty-message p {
    margin: 0.5rem 0;
  }

  .empty-message p:first-child {
    font-size: 1.2rem;
    font-weight: 500;
  }

  .widget-highlight {
    animation: highlight-pulse 2s ease-in-out;
    box-shadow: 0 0 0 2px var(--accent-color, #0078d4);
    z-index: 1;
  }

  @keyframes highlight-pulse {
    0% { box-shadow: 0 0 0 2px var(--accent-color, #0078d4); }
    50% { box-shadow: 0 0 0 6px var(--accent-color, #0078d4); }
    100% { box-shadow: 0 0 0 2px var(--accent-color, #0078d4); }
  }

  /* Widget removal animation */
  .widget-removing {
    transition: opacity 0.3s ease, transform 0.3s ease;
    opacity: 0;
    transform: scale(0.95);
  }
`;