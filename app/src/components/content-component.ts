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
  DOM,
  ViewTemplate,
} from '@microsoft/fast-element'
import { WidgetDefinition, widgetService, WidgetService } from '../services/widget-service'
import { getSingletonManager } from '../services/singleton-manager'

const template = html<ContentComponent>/*html*/ `
  <div class="content-container">
    <div class="content-header">
      <h1>${(x) => x.pageTitle}</h1>
    </div>

    <div class="widgets-container">
      ${when<ContentComponent>(x => !x.ready, html<ContentComponent>/*html*/ `
        <div class="empty-message">Loading...</div>`
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
  template: template,
  styles,
})
export class ContentComponent extends FASTElement {
  @observable pageTitle = 'Dashboard'
  @observable activeWidgets: WidgetDefinition[] = []
  @observable ready: boolean = false

  private _initialWidgetsLoaded = false

  @attr({ attribute: 'initialwidgets' })
  initialWidgets: string = ''

  static get observedAttributes(): string[] {
    return ['initialwidgets']
  }

  connectedCallback(): void {
    super.connectedCallback()
    widgetService.onWidgetsRegistered(() => {
      this.loadWidgets()
    })

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
        await this.loadInitialWidgets(widgetIds)
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

      this.activeWidgets.push(...widgets)

      console.log('Active widgets updated:', this.activeWidgets.length);
      // Observable.notify(this, 'activeWidgets')
      this.addWidgetsToDOM()
      this.ready = true
      console.log('Content ready:', this.ready)

    } catch (error) {
      console.error('Error loading widgets:', error)
    }
  }
  addWidgetsToDOM() {
    console.log('Adding widgets to DOM...')
    const widgetContainer = this.shadowRoot?.querySelector('.widgets-container') as HTMLElement
    this.activeWidgets.forEach((widget) => {
      const widgetElement = document.createElement(widget.elementName) as any
      if (widget.defaultConfig) {
        widgetElement.config = widget.defaultConfig;
      }
      widgetContainer.appendChild(widgetElement);
    })
  }
}
