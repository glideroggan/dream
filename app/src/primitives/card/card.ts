import { FASTElement, customElement, attr, html, css } from "@microsoft/fast-element";

const template = html<CardPrimitive>`
  <div class="card" part="card">
    <div class="header" part="header">
      <slot name="header"></slot>
    </div>
    <div class="content" part="content">
      <slot></slot>
    </div>
    <div class="footer" part="footer">
      <slot name="footer"></slot>
    </div>
  </div>
`;

const styles = css`
  :host {
    display: inline-flex;
    flex-direction: column;
    box-sizing: border-box;
    font-family: var(--body-font, "Inter", sans-serif);
    color: var(--text-color);
    background-color: var(--surface-color);
    border-radius: var(--card-border-radius, var(--radius-md, 8px));
    border: 1px solid transparent;
    transition: 
      box-shadow 0.2s ease-in-out, 
      transform 0.2s ease-in-out, 
      border-color 0.2s ease-in-out;
  }

  :host([full-width]) {
    display: flex;
    width: 100%;
  }

  .card {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
  }

  /* Elevation Variants */
  :host([elevation="flat"]) {
    box-shadow: none;
  }

  :host([elevation="raised"]) {
    box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.1));
  }

  :host([elevation="elevated"]) {
    box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
  }

  /* Bordered Variant */
  :host([bordered]) {
    border-color: var(--border-color);
  }

  /* Interactive State */
  :host([interactive]) {
    cursor: pointer;
  }

  :host([interactive][elevation="flat"]:hover) {
    box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.1));
  }

  :host([interactive][elevation="raised"]:hover) {
    box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
    transform: translateY(-1px);
  }

  :host([interactive][elevation="elevated"]:hover) {
    box-shadow: var(--shadow-lg, 0 10px 15px rgba(0, 0, 0, 0.1));
    transform: translateY(-1px);
  }

  /* Header Styles */
  .header {
    width: 100%;
  }

  slot[name="header"] {
    display: block;
    padding: var(--card-padding, var(--space-md, 16px));
    padding-bottom: var(--space-sm, 8px);
    font-weight: 500;
    font-size: 1.1em;
  }

  slot[name="header"]:empty {
    display: none;
  }

  /* Content Styles */
  .content {
    flex: 1;
    width: 100%;
  }

  slot:not([name]) {
    display: block;
    padding: var(--card-padding, var(--space-md, 16px));
  }

  /* Footer Styles */
  .footer {
    width: 100%;
  }

  slot[name="footer"] {
    display: block;
    padding: var(--card-padding, var(--space-md, 16px));
    padding-top: var(--space-sm, 8px);
    border-top: 1px solid var(--border-color);
  }

  slot[name="footer"]:empty {
    display: none;
  }
`;

@customElement({
  name: "dream-card",
  template,
  styles
})
export class CardPrimitive extends FASTElement {
  @attr elevation: "flat" | "raised" | "elevated" = "raised";
  @attr({ mode: "boolean" }) bordered: boolean = false;
  @attr({ mode: "boolean" }) interactive: boolean = false;
  @attr({ attribute: "full-width", mode: "boolean" }) fullWidth: boolean = false;
}
