import { FASTElement, customElement, html, css, attr } from "@microsoft/fast-element";

const template = html<WelcomeWidget>`
  <div class="welcome-widget">
    <h3>Welcome, ${x => x.username}!</h3>
    <p>Welcome to your personal dashboard. Here you can manage your accounts, track your investments, and more.</p>
    <div class="quick-actions">
      <button @click="${x => x.getStarted()}">Get Started</button>
      <button @click="${x => x.viewTutorial()}">View Tutorial</button>
    </div>
  </div>
`;

const styles = css`
  .welcome-widget {
    background: var(--background-color, #ffffff);
    color: var(--text-color, #333333);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 18px;
  }
  
  p {
    line-height: 1.5;
    margin-bottom: 16px;
  }
  
  .quick-actions {
    display: flex;
    gap: 12px;
  }
  
  button {
    background-color: var(--primary-color, #3498db);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  button:hover {
    background-color: var(--primary-color-hover, #2980b9);
  }
`;

@customElement({
  name: "welcome-widget",
  template,
  styles
})
export class WelcomeWidget extends FASTElement {
  @attr username: string = "User";
  
  getStarted() {
    console.debug("Get started clicked");
    // Add implementation
  }
  
  viewTutorial() {
    console.debug("View tutorial clicked");
    // Add implementation
  }
}
