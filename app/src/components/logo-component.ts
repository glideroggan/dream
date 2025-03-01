import { FASTElement, customElement, html, css } from '@microsoft/fast-element';

const template = html<LogoComponent>/*html*/`
  <div class="logo">
    <div class="logo-icon">✨</div>
    <div class="logo-text">
      <span class="logo-name">Dream</span>
      <span class="logo-tagline">Make it happen</span>
    </div>
  </div>
`;

const styles = css`
  :host {
    display: inline-block;
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
    color: white;
  }
  
  .logo-tagline {
    font-size: 0.7rem;
    opacity: 0.8;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.8);
  }
  
  @keyframes sparkle {
    0% { text-shadow: 0 0 5px rgba(255,255,255,0.3); }
    100% { text-shadow: 0 0 15px rgba(255,255,255,0.7), 0 0 25px rgba(255,223,186,0.5); }
  }
`;

@customElement({
  name: 'dream-logo',
  template,
  styles
})
export class LogoComponent extends FASTElement {}
