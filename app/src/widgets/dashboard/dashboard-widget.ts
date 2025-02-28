import { FASTElement, customElement, html, css, observable } from '@microsoft/fast-element';

const template = html<DashboardWidget>/*html*/`
  <div class="dashboard-widget">
    <h3>Dashboard Overview</h3>
    <div class="stats">
      <div class="stat-item">
        <div class="stat-value">${x => x.activeUsers}</div>
        <div class="stat-label">Active Users</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${x => x.totalProjects}</div>
        <div class="stat-label">Projects</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${x => x.completedTasks}</div>
        <div class="stat-label">Completed Tasks</div>
      </div>
    </div>
  </div>
`;

const styles = css`
  :host {
    display: block;
  }
  
  .dashboard-widget {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  
  h3 {
    margin-top: 0;
    color: #2c3e50;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 0.5rem;
  }
  
  .stats {
    display: flex;
    justify-content: space-around;
    text-align: center;
    margin-top: 1rem;
  }
  
  .stat-value {
    font-size: 1.8rem;
    font-weight: bold;
    color: #3498db;
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: #7f8c8d;
    margin-top: 0.2rem;
  }
`;

@customElement({
  name: 'dashboard-widget',
  template,
  styles
})
export class DashboardWidget extends FASTElement {
  @observable activeUsers = 128;
  @observable totalProjects = 25;
  @observable completedTasks = 843;
  @observable config: Record<string, unknown> = {};

  configChanged() {
    // Apply any configuration from the parent
    if (this.config.activeUsers !== undefined) {
      this.activeUsers = Number(this.config.activeUsers);
    }
    
    if (this.config.totalProjects !== undefined) {
      this.totalProjects = Number(this.config.totalProjects);
    }
    
    if (this.config.completedTasks !== undefined) {
      this.completedTasks = Number(this.config.completedTasks);
    }
  }
}
