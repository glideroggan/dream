import { FASTElement, customElement, html, css } from '@microsoft/fast-element';

const template = html<HeaderComponent>/*html*/`
  <div class="header-container">
    <div class="header-content">
      <div class="logo">
        <div class="logo-icon">✨</div>
        <div class="logo-text">
          <span class="logo-name">Dream</span>
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

const styles = css`
  :host {
    display: block;
    width: 100%;
  }
  
  .header-container {
    background-color: #2c3e50;
    background-image: linear-gradient(to right, #2c3e50, #4a6885);
    color: white;
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
    animation: sparkle 2s infinite alternate;
  }
  
  .logo-text {
    display: flex;
    flex-direction: column;
  }
  
  .logo-name {
    font-size: 1.5rem;
    font-weight: bold;
    letter-spacing: 0.5px;
  }
  
  .logo-tagline {
    font-size: 0.7rem;
    opacity: 0.8;
    letter-spacing: 0.5px;
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
  
  @keyframes sparkle {
    0% { text-shadow: 0 0 5px rgba(255,255,255,0.3); }
    100% { text-shadow: 0 0 15px rgba(255,255,255,0.7), 0 0 25px rgba(255,223,186,0.5); }
  }
`;

@customElement({
  name: 'dream-header',
  template,
  styles
})
export class HeaderComponent extends FASTElement {}
