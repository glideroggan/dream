import { FASTElement, customElement, attr, html, css, when } from "@microsoft/fast-element";

const template = html<InputPrimitive>`
  <div class="input-wrapper">
    ${when(x => x.label, html<InputPrimitive>`
      <label class="label" part="label" for="input-control">
        ${x => x.label}
      </label>
    `)}
    
    <div class="input-container" part="container">
      <slot name="prefix"></slot>
      <input
        class="input"
        part="input"
        id="input-control"
        type="${x => x.type}"
        :value="${x => x.value}"
        placeholder="${x => x.placeholder}"
        ?disabled="${x => x.disabled}"
        ?readonly="${x => x.readonly}"
        ?required="${x => x.required}"
        name="${x => x.name}"
        autocomplete="${x => x.autocomplete}"
        aria-invalid="${x => x.error}"
        aria-describedby="helper-text"
        @input="${(x, c) => x.handleInput(c.event)}"
        @change="${(x, c) => x.handleChange(c.event)}"
      />
      <slot name="suffix"></slot>
    </div>
    
    ${when(x => x.helper || (x.error && x.errorMessage), html<InputPrimitive>`
      <div 
        class="helper ${x => x.error ? 'error' : ''}" 
        part="helper" 
        id="helper-text"
      >
        ${x => x.error && x.errorMessage ? x.errorMessage : x.helper}
      </div>
    `)}
  </div>
`;

const styles = css`
  :host {
    display: inline-block;
    vertical-align: top;
    font-family: inherit;
    outline: none;
  }

  :host([full-width]) {
    display: block;
    width: 100%;
  }

  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .label {
    display: block;
    font-size: var(--font-size-sm, 14px);
    font-weight: var(--font-weight-medium, 500);
    color: var(--label-color, var(--text-color));
    line-height: 1.5;
    cursor: pointer;
  }

  .input-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    min-height: var(--input-min-height, 40px);
    padding: 0 var(--input-padding-x, 8px);
    border: var(--input-border-width, 1px) solid var(--border-color);
    border-radius: var(--input-border-radius, 4px);
    background: var(--surface-color);
    transition: 
      border-color var(--duration-fast, 120ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1)),
      box-shadow var(--duration-fast, 120ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1));
  }

  .input-container:hover {
    border-color: var(--accent-color);
  }

  .input-container:focus-within {
    border-color: var(--accent-color);
    box-shadow: var(--focus-ring, 0 0 0 2px var(--background-color), 0 0 0 4px var(--accent-color));
    z-index: 1;
  }

  /* Error State */
  :host([error]) .input-container {
    border-color: var(--error-color);
  }

  :host([error]) .input-container:focus-within {
    box-shadow: 0 0 0 2px var(--background-color), 0 0 0 4px var(--error-color);
  }

  :host([error]) .label {
    color: var(--error-color);
  }

  /* Success State */
  :host([success]) .input-container {
    border-color: var(--success-color);
  }

  :host([success]) .input-container:focus-within {
    box-shadow: 0 0 0 2px var(--background-color), 0 0 0 4px var(--success-color);
  }

  /* Disabled State */
  :host([disabled]) .input-container {
    background-color: var(--surface-color);
    border-color: var(--border-color);
    cursor: not-allowed;
    opacity: 0.6;
    pointer-events: none;
  }
  
  :host([disabled]) .label,
  :host([disabled]) .input,
  :host([disabled]) .helper {
    cursor: not-allowed;
    color: var(--text-muted);
  }

  /* Readonly State */
  :host([readonly]) .input-container {
    background-color: var(--background-color);
  }

  .input {
    flex: 1;
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    padding: var(--input-padding-y, 10px) 0;
    color: var(--text-color);
    font-family: inherit;
    font-size: var(--font-size-base, 16px);
    line-height: inherit;
    min-width: 0;
  }

  .input::placeholder {
    color: var(--text-muted);
    opacity: 1;
  }

  /* Slot styling */
  ::slotted(*) {
    display: flex;
    align-items: center;
    color: var(--text-muted);
  }
  
  slot[name="prefix"] {
    margin-right: var(--space-xs, 4px);
  }

  slot[name="suffix"] {
    margin-left: var(--space-xs, 4px);
  }

  .helper {
    font-size: var(--font-size-xs, 12px);
    color: var(--text-muted);
    line-height: var(--line-height-normal, 1.5);
    min-height: 1.5em; /* Prevent layout jump */
  }

  .helper.error {
    color: var(--error-color);
  }
`;

@customElement({
  name: "dream-input",
  template,
  styles,
  shadowOptions: { delegatesFocus: true }
})
export class InputPrimitive extends FASTElement {
  @attr type: "text" | "number" | "password" | "email" | "search" | "tel" | "url" = "text";
  @attr value: string = "";
  @attr placeholder: string = "";
  @attr label: string = "";
  @attr helper: string = "";
  @attr({ mode: "boolean" }) error: boolean = false;
  @attr({ attribute: "error-message" }) errorMessage: string = "";
  @attr({ mode: "boolean" }) success: boolean = false;
  @attr({ mode: "boolean" }) disabled: boolean = false;
  @attr({ mode: "boolean" }) readonly: boolean = false;
  @attr({ mode: "boolean" }) required: boolean = false;
  @attr name: string = "";
  @attr autocomplete: string = "off";
  @attr({ attribute: "full-width", mode: "boolean" }) fullWidth: boolean = false;

  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
  }

  handleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
  }
}
