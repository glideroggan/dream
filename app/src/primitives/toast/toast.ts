import { FASTElement, customElement, attr, html, css, type ValueConverter } from '@microsoft/fast-element';

const numberConverter: ValueConverter = {
    toView(value: number): string {
        return value.toString();
    },
    fromView(value: string): number {
        return parseInt(value, 10);
    }
};

const icons = {
    info: html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    success: html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    warning: html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    error: html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
};

@customElement({
    name: 'dream-toast',
    template: html`
        <div class="toast ${x => x.type}" part="toast" role="alert">
            <span class="icon" part="icon">
                ${x => icons[x.type as keyof typeof icons] || icons.info}
            </span>
            <span class="message" part="message">${x => x.message}</span>
            ${x => x.dismissible ? html`
                <button class="close" part="close" @click="${x => x.dismiss()}" aria-label="Dismiss">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            ` : ''}
        </div>
    `,
    styles: css`
        :host {
            display: block;
            contain: content;
            --info-color: var(--info-badge);
            --success-color: var(--success-color);
            --warning-color: var(--warning-color);
            --error-color: var(--error-color);
            
            /* Using theme vars for backgrounds if possible, otherwise keep subtleness but use theme colors */
            --bg-info: var(--theme-bg);
            --bg-success: var(--widget-bg); 
            --bg-warning: var(--workflow-bg);
            --bg-error: var(--notification-badge-bg); /* might be too strong, let's use hover-bg or something */
            
            font-family: var(--font-family, system-ui, -apple-system, sans-serif);
            margin-bottom: var(--space-sm, 8px);
        }

        .toast {
            display: flex;
            align-items: flex-start;
            padding: var(--toast-padding, 16px);
            background: var(--surface-color);
            border-radius: var(--toast-border-radius, 8px);
            box-shadow: var(--shadow-lg);
            max-width: var(--toast-max-width, 400px);
            width: 100%;
            pointer-events: auto;
            border-left: 4px solid transparent;
            animation: slideIn var(--duration-normal, 0.3s) cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(8px);
            color: var(--text-color);
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }

        :host(.dismissing) .toast {
            animation: fadeOut var(--duration-normal, 0.3s) cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Type Variants */
        .toast.info {
            border-left-color: var(--info-color);
            background: linear-gradient(to right, var(--hover-bg), var(--surface-color) 20%);
        }
        .toast.info .icon { color: var(--info-color); }

        .toast.success {
            border-left-color: var(--success-color);
            background: linear-gradient(to right, var(--widget-bg), var(--surface-color) 20%);
        }
        .toast.success .icon { color: var(--success-color); }

        .toast.warning {
            border-left-color: var(--warning-color);
            background: linear-gradient(to right, var(--workflow-bg), var(--surface-color) 20%);
        }
        .toast.warning .icon { color: var(--warning-color); }

        .toast.error {
            border-left-color: var(--error-color);
            background: linear-gradient(to right, var(--hover-bg), var(--surface-color) 20%);
        }
        .toast.error .icon { color: var(--error-color); }

        /* Icon */
        .icon {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
            margin-top: 2px;
        }

        /* Message */
        .message {
            flex-grow: 1;
            font-size: 0.875rem;
            line-height: 1.5;
            font-weight: 500;
        }

        /* Close Button */
        .close {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 4px;
            margin: -4px -4px -4px 8px;
            border-radius: 4px;
            color: var(--text-muted);
            transition: color 0.2s, background-color 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .close:hover {
            color: var(--text-color);
            background-color: var(--hover-bg);
        }
    `
})
export class ToastPrimitive extends FASTElement {
    @attr type: 'info' | 'success' | 'warning' | 'error' = 'info';
    @attr message: string = '';
    @attr({ converter: numberConverter }) duration: number = 4000;
    @attr({ mode: 'boolean' }) dismissible: boolean = true;

    private timeoutId: number | null = null;

    connectedCallback() {
        super.connectedCallback();
        this.startTimer();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.clearTimer();
    }

    private startTimer() {
        if (this.duration > 0) {
            this.timeoutId = setTimeout(() => {
                this.dismiss();
            }, this.duration);
        }
    }

    private clearTimer() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    dismiss() {
        this.clearTimer();
        this.classList.add('dismissing');
        
        // Wait for animation to finish before emitting event
        this.addEventListener('animationend', () => {
            this.$emit('dismiss');
        }, { once: true });
        
        // Fallback for safety
        setTimeout(() => {
            this.$emit('dismiss');
        }, 400); 
    }
}
