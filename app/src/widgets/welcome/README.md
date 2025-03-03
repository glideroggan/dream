# Welcome Widget

A customizable welcome widget designed to help new users understand the application interface.

## Features

- Interactive tabbed interface explaining key UI components
- Guided demonstrations of UI features
- User preference to show or hide on startup
- Customizable through configuration

## Usage

Add the welcome widget to your page:

```html
<welcome-widget widget-title="Welcome to Your Application"></welcome-widget>
```

## Configuration Options

The widget accepts the following configuration properties:

| Property | Type | Description |
|----------|------|-------------|
| title | string | The title displayed at the top of the widget |
| message | string | The introductory message |
| activeTab | string | The initially active tab (navigation, search, widgets, workflows) |
| showOnStartup | boolean | Whether to show the widget on startup |

## Events

| Event | Description |
|-------|-------------|
| initialized | Fired when the widget is fully initialized |
| dismiss | Fired when user clicks the dismiss button |
| demo-request | Fired when user requests a feature demonstration |

## Example Configuration

```javascript
const welcomeWidget = document.querySelector('welcome-widget');
welcomeWidget.config = {
  title: 'Welcome to Our Platform',
  message: 'Let us guide you through our interface',
  activeTab: 'widgets',
  showOnStartup: true
};
```

## Styling

The widget uses CSS variables for theming:

- `--background-color`: Widget background
- `--heading-color`: Title color
- `--subheading-color`: Section heading color
- `--text-color`: General text color
- `--accent-color`: Buttons and highlights
- `--accent-hover-color`: Button hover state
- `--secondary-color`: Secondary button color
- `--secondary-hover-color`: Secondary button hover state
