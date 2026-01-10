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
        <button class="theme-toggle" @click="${x => x.toggleTheme()}">
          <span class="theme-toggle-icon light-icon">☀️</span>
          <span class="theme-toggle-icon dark-icon">🌙</span>
        </button>
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
  
  .theme-toggle {
    background: transparent;
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    color: var(--text-light);
    transition: background-color 0.2s ease;
    margin-right: 8px;
  }
  
  .theme-toggle:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .theme-toggle-icon {
    position: absolute;
    font-size: 1.25rem;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .light-icon {
    opacity: 0;
    transform: translateY(100%);
  }
  
  .dark-icon {
    opacity: 1;
    transform: translateY(0);
  }
  
  :host([dark-theme]) .light-icon {
    opacity: 1;
    transform: translateY(0);
  }
  
  :host([dark-theme]) .dark-icon {
    opacity: 0;
    transform: translateY(-100%);
  }
  
  /* Style adjustments for dark theme */
  :host([dark-theme]) .header-container {
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
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
export class HeaderComponent extends FASTElement {
  private darkTheme = false;
  
  connectedCallback() {
    super.connectedCallback();
    
    // Check for saved preference first
    const savedTheme = localStorage.getItem('theme');
    
    let isDarkTheme: boolean;
    if (savedTheme) {
      // Use saved preference
      isDarkTheme = savedTheme === 'dark';
    } else {
      // Fall back to system preference
      isDarkTheme = document.body.classList.contains('dark-theme') ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches &&
         !document.body.classList.contains('light-theme-forced'));
    }
       
    this.darkTheme = isDarkTheme;
    this.updateThemeAttribute();
    this.applyThemeToBody();
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
          this.darkTheme = e.matches;
          this.updateThemeAttribute();
          this.applyThemeToBody();
        }
      });
  }
  
  toggleTheme() {
    this.darkTheme = !this.darkTheme;
    this.updateThemeAttribute();
    this.applyThemeToBody();
    
    // Save preference
    localStorage.setItem('theme', this.darkTheme ? 'dark' : 'light');
  }
  
  private updateThemeAttribute() {
    if (this.darkTheme) {
      this.setAttribute('dark-theme', '');
    } else {
      this.removeAttribute('dark-theme');
    }
  }
  
  private applyThemeToBody() {
    if (this.darkTheme) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme-forced');
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme-forced');
    }
  }
}
