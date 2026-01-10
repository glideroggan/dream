import { FASTElement, customElement, attr, html, css, when } from "@microsoft/fast-element";

const template = html<ButtonPrimitive>`
  <button
    class="button"
    part="button"
    ?disabled="${x => x.disabled || x.loading}"
    type="${x => x.type}"
    aria-busy="${x => x.loading}"
    aria-disabled="${x => x.disabled}"
  >
    ${when(x => x.loading, html`<span class="spinner" part="spinner"></span>`)}
    <span class="content ${x => x.loading ? 'hidden' : ''}" part="content">
      <slot></slot>
    </span>
  </button>
`;

const styles = css`
  :host {
    display: inline-block;
    vertical-align: middle;
    outline: none;
    font-family: inherit;
  }

  :host([full-width]) {
    display: block;
    width: 100%;
  }

  .button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 100%;
    border: none;
    outline: none;
    cursor: pointer;
    text-decoration: none;
    background: none;
    transition: 
      background-color var(--duration-fast, 120ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1)),
      color var(--duration-fast, 120ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1)),
      border-color var(--duration-fast, 120ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1)),
      transform var(--duration-fast, 120ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1)),
      box-shadow var(--duration-fast, 120ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1));
    border-radius: var(--radius-sm, 4px);
    font-weight: var(--font-weight-medium, 500);
    line-height: 1;
    overflow: hidden;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  /* Sizes */
  :host([size="sm"]) .button {
    padding: var(--space-xs, 4px) var(--space-sm, 8px);
    font-size: var(--font-size-sm, 14px);
    gap: 6px;
    height: 28px;
  }

  :host([size="md"]) .button {
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    font-size: var(--font-size-sm, 14px);
    gap: 8px;
    height: 36px;
  }

  :host([size="lg"]) .button {
    padding: var(--space-sm, 8px) var(--space-lg, 24px);
    font-size: var(--font-size-base, 16px);
    gap: 10px;
    height: 44px;
  }

  /* States: Focus */
  .button:focus-visible {
    box-shadow: var(--focus-ring, 0 0 0 2px var(--background-color), 0 0 0 4px var(--accent-color));
    z-index: 1;
  }

  /* States: Disabled */
  .button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  }

  /* States: Active/Pressed */
  .button:not(:disabled):active {
    transform: scale(0.98);
  }

  /* Variants */
  
  /* Primary (Default) */
  :host([variant="primary"]) .button {
    background-color: var(--accent-color);
    color: var(--text-light);
    border: 1px solid transparent;
  }

  :host([variant="primary"]) .button:not(:disabled):hover {
    filter: brightness(1.05);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(136, 189, 242, 0.3);
  }

  :host([variant="primary"]) .button:not(:disabled):active {
    filter: brightness(0.95);
    box-shadow: none;
    transform: scale(0.98);
  }

  /* Secondary */
  :host([variant="secondary"]) .button {
    background-color: transparent;
    color: var(--accent-color);
    border: 1px solid var(--accent-color);
  }

  :host([variant="secondary"]) .button:not(:disabled):hover {
    background-color: var(--hover-bg);
    transform: translateY(-1px);
  }

  :host([variant="secondary"]) .button:not(:disabled):active {
    background-color: var(--hover-bg);
    transform: scale(0.98);
  }

  /* Ghost */
  :host([variant="ghost"]) .button {
    background-color: transparent;
    color: var(--accent-color);
    border: 1px solid transparent;
  }

  :host([variant="ghost"]) .button:not(:disabled):hover {
    background-color: var(--hover-bg);
  }

  :host([variant="ghost"]) .button:not(:disabled):active {
    background-color: var(--hover-bg);
    transform: scale(0.98);
  }

  /* Danger */
  :host([variant="danger"]) .button {
    background-color: var(--error-color);
    color: var(--text-light);
    border: 1px solid transparent;
  }

  :host([variant="danger"]) .button:not(:disabled):hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
  }

  :host([variant="danger"]) .button:not(:disabled):active {
    filter: brightness(0.9);
    box-shadow: none;
    transform: scale(0.98);
  }

  /* Loading State */
  .content {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: inherit;
    transition: opacity var(--duration-fast, 120ms);
  }

  .content.hidden {
    opacity: 0;
    visibility: hidden;
  }

  .spinner {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 1em;
    height: 1em;
    margin-left: -0.5em;
    margin-top: -0.5em;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

@customElement({
  name: "dream-button",
  template,
  styles
})
export class ButtonPrimitive extends FASTElement {
  @attr variant: "primary" | "secondary" | "ghost" | "danger" = "primary";
  @attr size: "sm" | "md" | "lg" = "md";
  @attr({ mode: "boolean" }) disabled: boolean = false;
  @attr({ mode: "boolean" }) loading: boolean = false;
  @attr({ attribute: "full-width", mode: "boolean" }) fullWidth: boolean = false;
  @attr type: "button" | "submit" | "reset" = "button";
}
