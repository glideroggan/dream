import { FASTElement, customElement, attr, html, css } from "@microsoft/fast-element";

const template = html<CheckboxPrimitive>/*html*/`
  <div class="checkbox-wrapper ${x => x.checked ? 'checked' : ''} ${x => x.disabled ? 'disabled' : ''}" 
       @click="${(x, c) => !x.disabled && x.handleClick(c.event)}">
    <div class="custom-checkbox ${x => x.error ? 'error' : ''}">
      ${x => x.checked ? html`
        <svg class="checkmark" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path>
        </svg>
      ` : ''}
    </div>
    <label class="checkbox-label">
      <slot></slot>
    </label>
  </div>
  ${x => x.error && x.errorMessage ? html`
    <div class="error-message">${x => x.errorMessage}</div>
  ` : ''}
`;

const styles = css`
  :host {
    display: block;
  }
  
  .checkbox-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    user-select: none;
    padding: 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .checkbox-wrapper:not(.disabled):hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .checkbox-wrapper.checked:not(.disabled) {
    background-color: rgba(52, 152, 219, 0.05);
  }
  
  .checkbox-wrapper.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Custom checkbox design */
  .custom-checkbox {
    width: 20px;
    height: 20px;
    min-width: 20px;
    border: 2px solid var(--checkbox-border-color, #ccc);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--checkbox-bg-color, white);
    transition: all 0.2s;
  }
  
  .checkbox-wrapper:not(.disabled):hover .custom-checkbox {
    border-color: var(--checkbox-hover-color, var(--accent-color, #3498db));
  }
  
  .checkbox-wrapper.checked:not(.disabled) .custom-checkbox {
    background-color: var(--checkbox-checked-bg, var(--accent-color, #3498db));
    border-color: var(--checkbox-checked-border, var(--accent-color, #3498db));
  }
  
  .custom-checkbox.error {
    border-color: var(--error-color, #e74c3c);
  }
  
  .checkmark {
    width: 16px;
    height: 16px;
    fill: var(--checkbox-checkmark-color, white);
    animation: scale 0.2s ease-in-out;
  }
  
  @keyframes scale {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  
  .checkbox-label {
    font-size: 14px;
    color: var(--text-color, inherit);
    line-height: 1.4;
    flex: 1;
  }
  
  .error-message {
    color: var(--error-color, #e74c3c);
    font-size: 14px;
    margin-top: 6px;
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

@customElement({
  name: "dream-checkbox",
  template,
  styles
})
export class CheckboxPrimitive extends FASTElement {
  @attr({ mode: "boolean" }) checked: boolean = false;
  @attr({ mode: "boolean" }) disabled: boolean = false;
  @attr({ mode: "boolean" }) error: boolean = false;
  @attr errorMessage: string = "";
  @attr name: string = "";
  @attr value: string = "";
  @attr ariaLabel: string = "";
  
  connectedCallback(): void {
    super.connectedCallback();
    
    // Set aria attributes for accessibility
    if (this.ariaLabel) {
      this.setAttribute("aria-label", this.ariaLabel);
    }
    this.setAttribute("role", "checkbox");
    this.setAttribute("aria-checked", this.checked.toString());
    
    if (this.disabled) {
      this.setAttribute("aria-disabled", "true");
    }
  }
  
  checkedChanged(): void {
    // Update ARIA attribute when checked state changes
    this.setAttribute("aria-checked", this.checked.toString());
    
    // Dispatch change event
    this.$emit("change", { 
      checked: this.checked,
      name: this.name,
      value: this.value
    });
  }
  
  disabledChanged(): void {
    if (this.disabled) {
      this.setAttribute("aria-disabled", "true");
    } else {
      this.removeAttribute("aria-disabled");
    }
  }
  
  /**
   * Handle click events on the checkbox
   */
  handleClick(event: Event): void {
    if (this.disabled) return;
    
    // Toggle checked state
    this.checked = !this.checked;
    
    // Prevent event bubbling if needed
    event.stopPropagation();
    
    // Dispatch input event for forms
    this.$emit("input", { 
      checked: this.checked,
      name: this.name,
      value: this.value
    });
  }
}
