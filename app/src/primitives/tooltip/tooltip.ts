import { FASTElement, customElement, attr, html, css } from "@microsoft/fast-element";

const template = html<TooltipPrimitive>`
  <div class="tooltip-wrapper" @mouseenter="${x => x.show()}" @mouseleave="${x => x.hide()}" @focus="${x => x.show()}" @blur="${x => x.hide()}">
    <slot></slot>
    <div 
      class="tooltip ${x => x.position}" 
      part="tooltip" 
      role="tooltip"
      id="${x => x.tooltipId}"
    >
      <span class="arrow" part="arrow"></span>
      <span class="content" part="content">${x => x.text}</span>
    </div>
  </div>
`;

const styles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  .tooltip-wrapper {
    display: inline-block;
    position: relative;
  }

  .tooltip {
    position: absolute;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    z-index: var(--z-tooltip, 600);
    padding: var(--space-xs, 4px) var(--space-sm, 8px);
    background-color: var(--primary-color);
    color: var(--text-light);
    font-size: var(--font-size-sm, 14px);
    font-weight: var(--font-weight-normal, 400);
    line-height: 1.4;
    border-radius: var(--radius-sm, 4px);
    box-shadow: var(--shadow-md);
    max-width: 200px;
    word-wrap: break-word;
    white-space: normal;
    transition: 
      opacity var(--duration-fast, 120ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1)),
      visibility var(--duration-fast, 120ms) var(--easing-default, cubic-bezier(0.4, 0, 0.2, 1));
  }

  :host([visible]) .tooltip {
    opacity: 1;
    visibility: visible;
  }

  /* Arrow */
  .arrow {
    position: absolute;
    width: 0;
    height: 0;
    border: 6px solid transparent;
  }

  /* Position: Top (default) */
  .tooltip.top {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
  }

  .tooltip.top .arrow {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-top-color: var(--primary-color);
    border-bottom: none;
  }

  /* Position: Bottom */
  .tooltip.bottom {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 8px;
  }

  .tooltip.bottom .arrow {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-color: var(--primary-color);
    border-top: none;
  }

  /* Position: Left */
  .tooltip.left {
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-right: 8px;
  }

  .tooltip.left .arrow {
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-left-color: var(--primary-color);
    border-right: none;
  }

  /* Position: Right */
  .tooltip.right {
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 8px;
  }

  .tooltip.right .arrow {
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-right-color: var(--primary-color);
    border-left: none;
  }

  /* Disabled state */
  :host([disabled]) .tooltip {
    display: none;
  }
`;

@customElement({
  name: "dream-tooltip",
  template,
  styles
})
export class TooltipPrimitive extends FASTElement {
  @attr text: string = "";
  @attr position: "top" | "right" | "bottom" | "left" = "top";
  @attr delay: number = 200;
  @attr({ mode: "boolean" }) disabled: boolean = false;
  @attr({ mode: "boolean" }) visible: boolean = false;

  private timeoutId: number | null = null;
  private static idCounter = 0;
  readonly tooltipId = `dream-tooltip-${++TooltipPrimitive.idCounter}`;

  connectedCallback() {
    super.connectedCallback();
    this.setupAriaDescribedBy();
  }

  private setupAriaDescribedBy() {
    const slottedElement = this.querySelector("*");
    if (slottedElement) {
      slottedElement.setAttribute("aria-describedby", this.tooltipId);
    }
  }

  show() {
    if (this.disabled) return;
    
    this.clearTimeout();
    this.timeoutId = window.setTimeout(() => {
      this.visible = true;
    }, this.delay);
  }

  hide() {
    this.clearTimeout();
    this.visible = false;
  }

  private clearTimeout() {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearTimeout();
  }
}
