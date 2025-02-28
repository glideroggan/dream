import {
  FASTElement,
  customElement,
  html,
  css,
  observable,
  attr,
  repeat,
  when,
  Observable,
  volatile,
} from '@microsoft/fast-element'
import { WidgetDefinition, widgetService, WidgetService } from '../services/widget-service'
import { getSingletonManager } from '../services/singleton-manager'

// Add a debug handler to see when the condition is evaluated
const debugTemplate = html<ContentComponent>/*html*/ `
  <div class="content-container">
    <div class="content-header">
      <h1>${(x) => x.pageTitle}</h1>
      <div>Debug: Active widgets count: ${(x) => x.activeWidgets.length}</div>
      <div>Debug: have widgets: ${(x) => x.haveWidgets}</div>
    </div>

    <div class="widgets-container">
      ${when(
        (x) => x.haveWidgets,
        html`
          ${repeat(
            (x) => x.activeWidgets,
            html<WidgetDefinition>/*html*/ `
              <div class="widget">
                <${(x) => x.elementName} 
                  :config="${(x, c) => x.defaultConfig || {}}"
                ></${(x) => x.elementName}>
              </div>
            `
          )}
        `,
        html`
          <div class="empty-message">No widgets configured for this page.</div>
        `
      )}
    </div>
  </div>
`

const styles = css`
  :host {
    display: block;
    height: 100%;
    overflow-y: auto;
  }

  .content-container {
    padding: 1.5rem;
    height: 100%;
    position: relative;
  }

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .widgets-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .widget {
    background: #ffffff;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    min-height: 200px;
  }

  .empty-message {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #666;
  }
`

@customElement({
  name: 'dream-content',
  template: debugTemplate, // Use the debug template for now
  styles,
})
export class ContentComponent extends FASTElement {
  @observable pageTitle = 'Dashboard'
  @observable activeWidgets: WidgetDefinition[] = []

  @volatile
  get haveWidgets(): boolean {
    return this.activeWidgets.length > 0
  }

  private _initialWidgetsLoaded = false

  // Use lowercase for attribute to match HTML conventions
  @attr({ attribute: 'initialwidgets' })
  initialWidgets: string = ''

  // Define observed attributes - this is necessary for attributeChangedCallback to work
  static get observedAttributes(): string[] {
    return ['initialwidgets']
  }

  connectedCallback(): void {
    super.connectedCallback()
    // Subscribe to widget registration event
    widgetService.onWidgetsRegistered(() => {
      this.loadWidgets()
    })

    // If widgets are already registered, load them immediately
    if (widgetService.areAllWidgetsRegistered()) {
      this.loadWidgets()
    } 
    console.log(
      `ContentComponent connected, initialWidgets: "${this.initialWidgets}"`
    )
  }

  async loadWidgets(): Promise<void> {
    console.log('Loading widgets...')
    await this.loadWidgetsFromAttribute()
  }

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    super.attributeChangedCallback(name, oldValue, newValue)

    if (name === 'initialwidgets' && newValue !== oldValue) {
      console.log(`initialWidgets attribute changed to: "${newValue}"`)
      this.initialWidgets = newValue
      // this.loadWidgetsFromAttribute();
    }
  }

  async activateWidgets(): Promise<void> {
    console.log('Activating widgets...')
    await this.loadWidgetsFromAttribute()
  }

  async loadWidgetsFromAttribute(): Promise<void> {
    console.log('Loading widgets:', this.initialWidgets)
    if (this.initialWidgets && !this._initialWidgetsLoaded) {
      const widgetIds = this.initialWidgets
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id)
      if (widgetIds.length > 0) {
        console.log(`Loading widgets: ${widgetIds.join(', ')}`)
        this._initialWidgetsLoaded = true
        this.loadInitialWidgets(widgetIds)
      }
    }
  }

  async loadInitialWidgets(widgetIds: string[]): Promise<void> {
    console.log('Loading initial widgets:', widgetIds)
    try {
      const widgetService = getSingletonManager().get(
        'WidgetService'
      ) as WidgetService
      const widgets = await widgetService.loadWidgets(widgetIds)
      console.log(`Loaded ${widgets.length} widgets:`, widgets)

      // Try a different approach to ensure reactivity
      // First create a new array and assign it
      const newWidgets = [...widgets]
      this.activeWidgets = newWidgets

      // Force notification
      console.log('Active widgets updated:', this.activeWidgets.length)
      Observable.notify(this, 'activeWidgets')
      Observable.notify(this, 'haveWidgets')
    } catch (error) {
      console.error('Error loading widgets:', error)
    }
  }
}
