import { FASTElement, customElement, html, css } from '@microsoft/fast-element';

const template = html<HeaderComponent>/*html*/`
  <div class="header-container">
    <div class="header-content">
      <div class="logo">
        <div class="logo-icon">✨</div>
        <div class="logo-text">
          <span class="logo-name">Wallet</span>
          <span class="logo-tagline">Make it happen</span>
        </div>
      </div>
      
      <div class="search-wrapper">
        <dream-search></dream-search>
      </div>
      
      <div class="header-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
`;

// ${themeVariables}
const styles = css`
  :host {
    display: block;
    width: 100%;
  }  
  
  .header-container {
    background-color: var(--header-bg);
    background-image: linear-gradient(to right, var(--header-bg), color-mix(in srgb, var(--header-bg) 60%, var(--secondary-color)));
    color: var(--text-light);
    padding: 0.75rem 1.5rem;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .logo-icon {
    font-size: 1.8rem;
    position: relative;
  }
  .logo-icon::after {
    content: "✨";
    position: absolute;
    top: 0;
    left: 0;
    opacity: 1;
    filter: blur(8px);
    // will-change: opacity, filter;
    // animation: sparkle-gpu 2s steps(10) infinite alternate;
  }
  
  .logo-text {
    display: flex;
    flex-direction: column;
  }
  
  .logo-name {
    font-size: 1.5rem;
    font-weight: bold;
    letter-spacing: 0.5px;
    color: var(--text-light);
  }
  
  .logo-tagline {
    font-size: 0.7rem;
    opacity: 0.8;
    letter-spacing: 0.5px;
    color: var(--text-light);
  }
  
  .search-wrapper {
    flex: 1;
    max-width: 600px;
    margin: 0 2rem;
  }
  
  .header-actions {
    display: flex;
    gap: 1rem;
  }
  
  @keyframes sparkle-gpu {
    0% { 
      opacity: 0.2;
      filter: blur(2px);
    }
    100% { 
      opacity: 0.8;
      filter: blur(4px);
    }
  }
`;

@customElement({
  name: 'dream-header',
  template,
  styles
})
export class HeaderComponent extends FASTElement {}
