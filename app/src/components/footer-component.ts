import { FASTElement, customElement, html, css } from '@microsoft/fast-element';

const template = html<FooterComponent>`
  <div class="footer-container">
    <slot>© ${new Date().getFullYear()} Wallet App. All rights reserved.</slot>
  </div>
`;

const styles = css`
  :host {
    display: block;
    width: 100%;
  }
  
  .footer-container {
    background-color: #2c3e50;
    color: white;
    padding: 1rem;
    text-align: center;
  }
`;

@customElement({
  name: 'dream-footer',
  template,
  styles
})
export class FooterComponent extends FASTElement {}
