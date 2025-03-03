// import { FASTElement, customElement, html, css, attr } from "@microsoft/fast-element";

// const template = html<LoadingOverlay>/*html*/`
//   <div class="overlay ${x => x.isActive ? 'active' : ''}">
//     <div class="loader-container">
//       <div class="spinner"></div>
//       <div class="message">${x => x.message}</div>
//     </div>
//   </div>
// `;

// const styles = css`
//   .overlay {
//     position: fixed;
//     top: 0;
//     left: 0;
//     right: 0;
//     bottom: 0;
//     background-color: rgba(0, 0, 0, 0.3);
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     z-index: 2000;
//     opacity: 0;
//     pointer-events: none;
//     transition: opacity 0.3s ease;
//   }

//   .overlay.active {
//     opacity: 1;
//     pointer-events: all;
//   }

//   .loader-container {
//     background-color: white;
//     padding: 20px 40px;
//     border-radius: 8px;
//     box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     gap: 16px;
//   }

//   .spinner {
//     width: 40px;
//     height: 40px;
//     border: 4px solid rgba(0, 0, 0, 0.1);
//     border-radius: 50%;
//     border-top-color: var(--primary-color, #3498db);
//     animation: spin 0.8s linear infinite;
//   }

//   .message {
//     font-size: 16px;
//     font-weight: 500;
//     color: var(--text-color, #333);
//   }

//   @keyframes spin {
//     to { transform: rotate(360deg); }
//   }
// `;

// @customElement({
//   name: "loading-overlay",
//   template,
//   styles
// })
// export class LoadingOverlay extends FASTElement {
//   @attr({ mode: "boolean" }) isActive: boolean = false;
//   @attr message: string = "Loading...";

//   /**
//    * Show the loading overlay
//    * @param message Optional custom message to display
//    */
//   public show(message?: string): void {
//     if (message) {
//       this.message = message;
//     }
//     this.isActive = true;
//   }

//   /**
//    * Hide the loading overlay
//    */
//   public hide(): void {
//     this.isActive = false;
//   }
// }
