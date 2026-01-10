import { FASTElement, customElement, html, css, observable } from "@microsoft/fast-element";

// Import primitives using import map aliases
import "@primitives/button";
import "@primitives/input";
import "@primitives/select";
import "@primitives/card";
import "@primitives/checkbox";
import "@primitives/toast";
import "@primitives/skeleton";
import "@primitives/tooltip";
import { toastService } from "@primitives/toast-service";

const template = html<PrimitivesTestPage>`
  <div class="page-container">
    <header class="page-header">
      <div class="header-content">
        <div>
          <h1>Dream Primitives</h1>
          <p class="subtitle">Visual testing suite for design system components</p>
        </div>
      </div>
    </header>

    <main class="grid-layout">
      
      <!-- Buttons Section -->
      <section class="component-section">
        <div class="section-header">
          <h2>Buttons</h2>
          <span class="badge">dream-button</span>
        </div>
        
        <dream-card class="showcase-card">
          <div class="variant-grid">
            <div class="variant-group">
              <label>Variants</label>
              <div class="row">
                <dream-button variant="primary">Primary</dream-button>
                <dream-button variant="secondary">Secondary</dream-button>
                <dream-button variant="ghost">Ghost</dream-button>
                <dream-button variant="danger">Danger</dream-button>
              </div>
            </div>

            <div class="variant-group">
              <label>Sizes</label>
              <div class="row items-center">
                <dream-button size="sm">Small</dream-button>
                <dream-button size="md">Medium</dream-button>
                <dream-button size="lg">Large</dream-button>
              </div>
            </div>

            <div class="variant-group">
              <label>States</label>
              <div class="row">
                <dream-button disabled>Disabled</dream-button>
                <dream-button loading>Loading</dream-button>
                <dream-button variant="secondary" loading>Loading</dream-button>
              </div>
            </div>

            <div class="variant-group">
              <label>Full Width</label>
              <dream-button full-width variant="primary">Full Width Button</dream-button>
            </div>
          </div>
        </dream-card>
      </section>

      <!-- Inputs Section -->
      <section class="component-section">
        <div class="section-header">
          <h2>Inputs</h2>
          <span class="badge">dream-input</span>
        </div>
        
        <dream-card class="showcase-card">
          <div class="variant-grid col-2">
            <dream-input label="Text Input" placeholder="Enter text..." helper="Standard input field"></dream-input>
            <dream-input label="Email" type="email" placeholder="user@example.com" value="test@example.com"></dream-input>
            
            <dream-input label="Password" type="password" placeholder="••••••••"></dream-input>
            <dream-input label="Search" type="search" placeholder="Search..."></dream-input>
            
            <dream-input label="Success State" success value="Valid Input" helper="Looks good!"></dream-input>
            <dream-input label="Error State" error error-message="This field is required" value="Invalid"></dream-input>
            
            <dream-input label="Disabled" disabled value="Cannot edit this"></dream-input>
            <dream-input label="Read Only" readonly value="Read only content"></dream-input>
            
            <dream-input label="With Prefix Icon" placeholder="0.00">
              <span slot="prefix">$</span>
            </dream-input>
            
            <dream-input label="With Suffix Icon" placeholder="Search">
              <span slot="suffix">🔍</span>
            </dream-input>
          </div>
        </dream-card>
      </section>

      <!-- Select Section -->
      <section class="component-section">
        <div class="section-header">
          <h2>Select</h2>
          <span class="badge">dream-select</span>
        </div>
        
        <dream-card class="showcase-card">
          <div class="variant-grid col-2">
            <dream-select label="Standard Select" helper="Choose an option">
              <option value="" disabled selected hidden>Select an option</option>
              <option value="1">Option One</option>
              <option value="2">Option Two</option>
              <option value="3">Option Three</option>
            </dream-select>

            <dream-select label="Disabled Select" disabled>
              <option>Cannot select</option>
            </dream-select>

            <dream-select label="Error State" error error-message="Selection required">
              <option value="" disabled selected hidden>Select...</option>
            </dream-select>
            
            <dream-select label="Full Width" full-width>
              <option>Full Width Option</option>
            </dream-select>
          </div>
        </dream-card>
      </section>

      <!-- Checkbox Section -->
      <section class="component-section">
        <div class="section-header">
          <h2>Checkboxes</h2>
          <span class="badge">dream-checkbox</span>
        </div>
        
        <dream-card class="showcase-card">
          <div class="variant-grid">
            <div class="row">
              <dream-checkbox>Standard Checkbox</dream-checkbox>
              <dream-checkbox checked>Checked State</dream-checkbox>
            </div>
            <div class="row">
              <dream-checkbox disabled>Disabled Unchecked</dream-checkbox>
              <dream-checkbox disabled checked>Disabled Checked</dream-checkbox>
            </div>
            <div class="row">
              <dream-checkbox error error-message="This must be checked">Error State</dream-checkbox>
            </div>
          </div>
        </dream-card>
      </section>

      <!-- Card Section -->
      <section class="component-section">
        <div class="section-header">
          <h2>Cards</h2>
          <span class="badge">dream-card</span>
        </div>
        
        <div class="variant-grid col-3">
          <dream-card elevation="flat" bordered>
            <div slot="header">Flat & Bordered</div>
            <p>This is a flat card with a border. Useful for subtle groupings within other containers.</p>
            <div slot="footer">
              <dream-button size="sm" variant="ghost">Action</dream-button>
            </div>
          </dream-card>

          <dream-card elevation="raised">
            <div slot="header">Raised (Default)</div>
            <p>Standard card elevation. Provides good separation from the background.</p>
            <div slot="footer">
              <dream-button size="sm" variant="secondary">Details</dream-button>
            </div>
          </dream-card>

          <dream-card elevation="elevated" interactive>
            <div slot="header">Elevated & Interactive</div>
            <p>Higher elevation and interactive hover states. Click me!</p>
            <div slot="footer">
              <dream-button size="sm">Primary</dream-button>
            </div>
          </dream-card>
        </div>
      </section>

      <!-- Toasts Section -->
      <section class="component-section">
        <div class="section-header">
          <h2>Toasts</h2>
          <span class="badge">dream-toast</span>
        </div>
        
        <dream-card class="showcase-card">
          <p class="mb-4">Click buttons to trigger toast notifications.</p>
          <div class="row">
            <dream-button @click="${x => x.showToast('info')}" variant="secondary">Info Toast</dream-button>
            <dream-button @click="${x => x.showToast('success')}" variant="secondary">Success Toast</dream-button>
            <dream-button @click="${x => x.showToast('warning')}" variant="secondary">Warning Toast</dream-button>
            <dream-button @click="${x => x.showToast('error')}" variant="danger">Error Toast</dream-button>
          </div>
        </dream-card>
      </section>

      <!-- Skeleton Section -->
      <section class="component-section">
        <div class="section-header">
          <h2>Skeletons</h2>
          <span class="badge">dream-skeleton</span>
        </div>
        
        <dream-card class="showcase-card">
          <div class="variant-grid">
            <div class="skeleton-row">
              <dream-skeleton variant="circle" width="48px" height="48px"></dream-skeleton>
              <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                <dream-skeleton variant="text" width="60%"></dream-skeleton>
                <dream-skeleton variant="text" width="90%"></dream-skeleton>
              </div>
            </div>
            
            <div class="skeleton-block">
              <dream-skeleton variant="rect" height="120px"></dream-skeleton>
            </div>
            
            <div class="skeleton-lines">
               <dream-skeleton variant="text" lines="3"></dream-skeleton>
            </div>
          </div>
        </dream-card>
      </section>

      <!-- Tooltip Section -->
      <section class="component-section">
        <div class="section-header">
          <h2>Tooltips</h2>
          <span class="badge">dream-tooltip</span>
        </div>
        
        <dream-card class="showcase-card">
          <div class="row justify-center py-8 gap-8">
            <dream-tooltip text="Tooltip on Top" position="top">
              <dream-button variant="ghost">Top</dream-button>
            </dream-tooltip>
            
            <dream-tooltip text="Tooltip on Bottom" position="bottom">
              <dream-button variant="ghost">Bottom</dream-button>
            </dream-tooltip>
            
            <dream-tooltip text="Tooltip on Left" position="left">
              <dream-button variant="ghost">Left</dream-button>
            </dream-tooltip>
            
            <dream-tooltip text="Tooltip on Right" position="right">
              <dream-button variant="ghost">Right</dream-button>
            </dream-tooltip>
          </div>
        </dream-card>
      </section>

    </main>
  </div>
`;

const styles = css`
  :host {
    display: block;
    height: 100%;
    overflow-y: auto;
    background-color: var(--background-color);
    color: var(--text-color);
    font-family: var(--body-font, "Inter", system-ui, sans-serif);
    --primary-color: var(--accent-color);
    --border-radius: 8px;
    --section-gap: 40px;
  }

  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px 80px;
  }

  .page-header {
    margin-bottom: 60px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  h1 {
    font-size: 32px;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.5px;
    color: var(--text-color);
  }

  .subtitle {
    margin: 8px 0 0;
    color: var(--text-muted);
    font-size: 16px;
  }

  h2 {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }

  .grid-layout {
    display: flex;
    flex-direction: column;
    gap: var(--section-gap);
  }

  .component-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .badge {
    font-size: 12px;
    font-family: monospace;
    background: var(--primary-color);
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    opacity: 0.8;
  }

  .showcase-card {
    padding: 32px;
    background: var(--surface-color);
  }

  .variant-grid {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .variant-grid.col-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .variant-grid.col-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .variant-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .variant-group label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    font-weight: 600;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
  }

  .row.items-center {
    align-items: center;
  }
  
  .row.justify-center {
    justify-content: center;
  }
  
  .row.py-8 {
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
  
  .gap-8 {
    gap: 32px;
  }

  .mb-4 {
    margin-bottom: 16px;
  }

  /* Skeleton specific layouts */
  .skeleton-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .skeleton-block {
    width: 100%;
  }
  
  .skeleton-lines {
    width: 100%;
  }

  @media (max-width: 768px) {
    .variant-grid.col-2,
    .variant-grid.col-3 {
      grid-template-columns: 1fr;
    }
    
    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
  }
`;

@customElement({
  name: "primitives-test-page",
  template,
  styles
})
export class PrimitivesTestPage extends FASTElement {
  showToast(type: 'info' | 'success' | 'warning' | 'error') {
    switch(type) {
      case 'info':
        toastService.info('This is an info message.');
        break;
      case 'success':
        toastService.success('Action completed successfully!', 3000);
        break;
      case 'warning':
        toastService.warning('Please check your inputs.');
        break;
      case 'error':
        toastService.error('Something went wrong. Try again.');
        break;
    }
  }
}
