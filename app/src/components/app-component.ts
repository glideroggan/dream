import { FASTElement, customElement, html, css } from '@microsoft/fast-element'

const template = html<AppComponent>/*html*/ `
  <div class="app-container">
    <dream-header></dream-header>
    <div class="app-main">
      <dream-sidebar></dream-sidebar>
      <main class="main-content">
        <slot> </slot>
      </main>
    </div>
    <dream-footer></dream-footer>
  </div>
`

// <dream-content initialwidgets="welcome,account"></dream-content>

const styles = css`
  :host {
    display: block;
    height: 100vh;
    --sidebar-bg: #2c3e50;
    --header-bg: #ffffff;
    --primary-color: #3498db;
    --text-color: #333333;
    --text-light: #ffffff;
    --border-color: #e0e0e0;
    --hover-bg: rgba(52, 152, 219, 0.1);
    --divider-color: #ecf0f1;
  }

  .app-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .app-main {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    position: relative;
    background-color: #f9f9f9;
  }
`

@customElement({
  name: 'dream-app',
  template,
  styles,
})
export class AppComponent extends FASTElement {}
