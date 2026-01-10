import { FASTElement, customElement, attr, html, css, when, repeat, ExecutionContext } from "@microsoft/fast-element";

const template = html<SkeletonPrimitive>`
  ${when(x => x.variant === 'text' && x.lines > 1, html<SkeletonPrimitive>`
    <div class="skeleton-group" style="width: ${x => x.width || '100%'}">
      ${repeat(x => Array.from({ length: x.lines }), html<any, SkeletonPrimitive>`
        <div 
          class="skeleton text" 
          ?animated="${(x, c: ExecutionContext<SkeletonPrimitive>) => c.parent.animated}"
          style="
            width: ${(x, c: ExecutionContext<SkeletonPrimitive>) => c.index === c.parent.lines - 1 ? '80%' : '100%'}; 
            height: ${(x, c: ExecutionContext<SkeletonPrimitive>) => c.parent.height || '16px'};
          "
        ></div>
      `)}
    </div>
  `)}
  
  ${when(x => x.variant !== 'text' || x.lines <= 1, html<SkeletonPrimitive>`
    <div 
      class="skeleton ${x => x.variant}"
      ?animated="${x => x.animated}" 
      style="
        width: ${x => x.width || (x.variant === 'circle' ? '40px' : '100%')}; 
        height: ${x => x.height || (x.variant === 'circle' ? '40px' : x.variant === 'rect' ? '100px' : '16px')};
      "
    ></div>
  `)}
`;

const styles = css`
  :host {
    display: block;
    width: 100%;
  }

  .skeleton-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .skeleton {
    background: var(--hover-bg);
    overflow: hidden;
    position: relative;
    display: block;
  }

  /* Variants */
  .skeleton.text {
    border-radius: var(--radius-sm, 4px);
  }

  .skeleton.circle {
    border-radius: var(--radius-full, 9999px);
    flex-shrink: 0;
  }

  .skeleton.rect {
    border-radius: var(--radius-md, 8px);
  }

  /* Animation */
  .skeleton[animated] {
    background: linear-gradient(90deg, 
      var(--hover-bg) 25%, 
      var(--surface-color) 50%, 
      var(--hover-bg) 75%
    );
    background-size: 200% 100%;
    animation: shimmer var(--duration-slower, 1.5s) ease-in-out infinite;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    .skeleton[animated] {
      animation: none !important;
      background: var(--hover-bg) !important;
    }
  }
`;

@customElement({
  name: "dream-skeleton",
  template,
  styles
})
export class SkeletonPrimitive extends FASTElement {
  @attr variant: "text" | "circle" | "rect" = "text";
  @attr width: string;
  @attr height: string;
  @attr({ mode: "boolean" }) animated: boolean = true;
  @attr({ converter: { fromView: val => parseInt(val, 10), toView: val => val.toString() } }) lines: number = 1;
}
