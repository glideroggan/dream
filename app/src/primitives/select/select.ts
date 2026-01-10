import { FASTElement, customElement, attr, html, css, when, ref } from "@microsoft/fast-element";

const chevronIcon = html`
<svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const template = html<SelectPrimitive>`
  <div class="select-wrapper">
    ${when(x => x.label, html`<label class="label" part="label">${x => x.label}</label>`)}
    <div class="select-container" part="container">
      <select
        class="select"
        part="select"
        ?disabled="${x => x.disabled}"
        ?required="${x => x.required}"
        :value="${x => x.value}"
        aria-invalid="${x => x.error}"
        @change="${(x, c) => x.handleChange(c.event)}"
        ${ref("selectElement")}
      >
        ${when(x => x.placeholder, html`<option value="" disabled selected hidden>${x => x.placeholder}</option>`)}
        <slot></slot>
      </select>
      <span class="chevron" part="chevron">
        ${chevronIcon}
      </span>
    </div>
    <div class="helper" part="helper">
      ${x => x.error && x.errorMessage ? x.errorMessage : x.helper}
    </div>
  </div>
`;

const styles = css`
  :host {
    display: inline-block;
    font-family: inherit;
    --input-padding-x: var(--space-sm, 8px);
    --input-padding-y: 10px;
    --input-border-radius: var(--radius-sm, 4px);
    --input-min-height: 40px;
    --border-color-default: var(--border-color);
    --border-color-hover: var(--accent-color);
    --border-color-focus: var(--accent-color);
    --border-color-error: var(--error-color);
    --bg-color: var(--surface-color);
    --chevron-color: var(--text-muted);
    --helper-color: var(--text-muted);
  }

  :host([full-width]) {
    display: block;
    width: 100%;
  }

  .select-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .label {
    font-size: var(--font-size-sm, 14px);
    font-weight: var(--font-weight-medium, 500);
    color: var(--label-color, var(--text-color));
  }

  .select-container {
    position: relative;
    width: 100%;
  }

  .select {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    min-height: var(--input-min-height);
    padding: var(--input-padding-y) var(--input-padding-x);
    padding-right: calc(var(--input-padding-x) + 20px); /* Space for chevron */
    background-color: var(--bg-color);
    border: 1px solid var(--border-color-default);
    border-radius: var(--input-border-radius);
    color: var(--text-color);
    font-family: inherit;
    font-size: var(--font-size-base, 16px);
    line-height: 1.5;
    cursor: pointer;
    transition: 
      border-color var(--duration-fast, 120ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1)),
      box-shadow var(--duration-fast, 120ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1));
  }

  .select:hover:not(:disabled) {
    border-color: var(--border-color-hover);
  }

  .select:focus {
    outline: none;
    border-color: var(--border-color-focus);
    box-shadow: var(--focus-ring, 0 0 0 2px var(--background-color), 0 0 0 4px var(--accent-color));
  }

  .select:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background-color: var(--bg-color);
  }

  :host([error]) .select {
    border-color: var(--border-color-error);
  }

  :host([error]) .select:focus {
    box-shadow: 0 0 0 2px var(--background-color), 0 0 0 4px var(--border-color-error);
  }

  .chevron {
    position: absolute;
    right: var(--input-padding-x);
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--chevron-color);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
  }

  .helper {
    font-size: var(--font-size-xs, 12px);
    color: var(--helper-color);
    min-height: 1.2em; /* Prevent layout jump */
  }

  :host([error]) .helper {
    color: var(--border-color-error);
  }
`;

@customElement({
  name: "dream-select",
  template,
  styles
})
export class SelectPrimitive extends FASTElement {
  @attr value: string = "";
  @attr label: string = "";
  @attr helper: string = "";
  @attr({ mode: "boolean" }) error: boolean = false;
  @attr({ attribute: "error-message" }) errorMessage: string = "";
  @attr({ mode: "boolean" }) disabled: boolean = false;
  @attr({ mode: "boolean" }) required: boolean = false;
  @attr name: string = "";
  @attr placeholder: string = "";
  @attr({ attribute: "full-width", mode: "boolean" }) fullWidth: boolean = false;

  selectElement: HTMLSelectElement;

  handleChange(e: Event) {
    e.stopPropagation(); // Stop propagation of the native event
    this.value = this.selectElement.value;
    this.$emit('change', { value: this.value, name: this.name });
  }

  valueChanged(oldValue: string, newValue: string) {
    if (this.selectElement && this.selectElement.value !== newValue) {
        this.selectElement.value = newValue;
    }
  }
}
