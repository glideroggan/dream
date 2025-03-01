// Import registries early so they can register with search
import { registerAllWorkflows } from './workflows/workflow-registry';

// Import workflow components
import './services/product-service';
import './workflows/swish-workflow';

console.debug('Main.ts initializing services...')
