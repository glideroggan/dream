import { AppComponent } from './components/app-component';
import { HeaderComponent } from './components/header-component';
import { SidebarComponent } from './components/sidebar-component';
import { ContentComponent } from './components/content-component';
import { FooterComponent } from './components/footer-component';
import { SearchComponent } from './components/search-component';

// Register widget service - will be used by components
import './services/widget-service';

// Define all custom elements
HeaderComponent;
SidebarComponent;
ContentComponent;
FooterComponent;
SearchComponent;
AppComponent;

// Note: Widgets will be loaded dynamically when needed