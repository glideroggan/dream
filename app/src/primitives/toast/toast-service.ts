import './toast.js';
import type { ToastPrimitive } from './toast.js';

interface ToastOptions {
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number;
    dismissible?: boolean;
}

export class ToastService {
    private static instance: ToastService;
    private container: HTMLElement | null = null;
    private readonly CONTAINER_ID = 'dream-toast-container';

    private constructor() {}

    static getInstance(): ToastService {
        if (!ToastService.instance) {
            ToastService.instance = new ToastService();
        }
        return ToastService.instance;
    }

    private ensureContainer(): HTMLElement {
        if (!this.container) {
            this.container = document.getElementById(this.CONTAINER_ID);
        }

        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = this.CONTAINER_ID;
            
            // Apply container styles
            Object.assign(this.container.style, {
                position: 'fixed',
                top: 'var(--space-md, 16px)',
                right: 'var(--space-md, 16px)',
                zIndex: 'var(--z-toast, 500)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-sm, 8px)',
                pointerEvents: 'none', // Allow clicks to pass through
                maxHeight: '100vh',
                overflow: 'hidden',
                // Ensure it stays on top of everything
                isolation: 'isolate' 
            });

            document.body.appendChild(this.container);
        }

        return this.container;
    }

    show(options: ToastOptions): void {
        const container = this.ensureContainer();
        
        // Create the toast element
        const toast = document.createElement('dream-toast') as ToastPrimitive;
        
        // Set attributes
        toast.setAttribute('type', options.type);
        toast.setAttribute('message', options.message);
        
        if (options.duration !== undefined) {
            toast.setAttribute('duration', options.duration.toString());
        }
        
        if (options.dismissible !== undefined) {
            if (!options.dismissible) {
                toast.removeAttribute('dismissible'); // It's boolean, presence means true usually, but we defined default true.
                // In FAST/HTML, boolean attribute presence = true.
                // Our component defaults dismissible to true.
                // If user passes false, we should probably set it to false explicitly via property or remove attribute if it was default.
                // Since it's a FAST element, we can set properties directly which is safer.
                toast.dismissible = false;
            } else {
                toast.dismissible = true;
            }
        }

        // Handle dismissal
        toast.addEventListener('dismiss', () => {
            toast.remove();
            if (this.container && this.container.children.length === 0) {
                this.container.remove();
                this.container = null;
            }
        });

        container.appendChild(toast);
    }

    info(message: string, duration?: number): void {
        this.show({ type: 'info', message, duration });
    }

    success(message: string, duration?: number): void {
        this.show({ type: 'success', message, duration });
    }

    warning(message: string, duration?: number): void {
        this.show({ type: 'warning', message, duration });
    }

    error(message: string, duration?: number): void {
        this.show({ type: 'error', message, duration });
    }
}

export const toastService = ToastService.getInstance();
