import {
  FASTElement,
  customElement,
  html,
  css,
  observable
} from '@microsoft/fast-element';

const template = html<SavingsPage>/*html*/`
  <div class="page-container">
    <div class="page-header">
      <h1>${x => x.pageTitle}</h1>
    </div>

    <div class="page-content">
      <div class="info-card">
        <div class="info-card-header">
          <h2>Savings Overview</h2>
        </div>
        <div class="info-card-content">
          <p>This is the savings page. It will show your savings accounts and goals.</p>
          <p>Coming soon!</p>
        </div>
      </div>
    </div>
  </div>
`;

const styles = css`
  :host {
    display: block;
    height: 100%;
    overflow-y: auto;
  }

  .page-container {
    padding: 1.5rem;
    height: 100%;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    margin: 0;
    font-size: 1.8rem;
  }

  .page-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .info-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }

  .info-card-header {
    padding: 1.25rem;
    border-bottom: 1px solid #eee;
  }

  .info-card-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .info-card-content {
    padding: 1.5rem;
  }

  @media (min-width: 768px) {
    .page-content {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

@customElement({
  name: 'savings-page',
  template,
  styles
})
export class SavingsPage extends FASTElement {
  @observable pageTitle: string = 'Savings';
}
