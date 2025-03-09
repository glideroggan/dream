// import { html } from "@microsoft/fast-element";
// import { ToAccountField } from "./transfer-toaccount-component";
// import { when, repeat } from "@microsoft/fast-element";

// export const template = html<ToAccountField>/*html*/`
// <div class="${x => x.formGroupClasses}">
//   <label for="toAccountInput">To Account</label>
//   <div class="autocomplete-wrapper">
//     <input 
//       id="toAccountInput"
//       type="text" 
//       autocomplete="off"
//       placeholder="Enter account name, contact name, or account number"
//       value="${x => x.inputValue}"
//       @input="${(x, c) => x.handleInput(c.event)}"
//       @focus="${(x, c) => x.handleFocus(c.event)}"
//       @blur="${(x, c) => x.handleBlur(c.event)}"
//       @keydown="${(x, c) => x.handleKeyup(c.event as KeyboardEvent)}"
//       ?required="${x => x.required}"
//       tabindex="1"
//     />
//     <div class="${x => x.itemDisplayClasses}">
//       ${when(x => x.selectedItem, html`
//         <div class="item-chip">
//           <span class="${x => x.getItemBadgeClasses()}">
//             ${x => x.selectedItem?.type === 'account' ? 'Account' : 'Contact'}
//           </span>
//           <span class="item-label">${x => x.selectedItem?.displayName}</span>
//           <button type="button" class="clear-button" @click="${x => x.clearSelection()}">×</button>
//         </div>
//       `)}
//     </div>
    
//     ${when(x => x.showDropdown, html`
//       <div class="${x => x.getContainerClasses()}">
//         ${when(x => x.filteredAccounts.length > 0, html`
//           <div class="group-label">My Accounts</div>
//           ${repeat(x => x.filteredAccounts, html`
//             <div class="${(item, c) => c.parent.getItemClasses(item)}" 
//                 data-id="${item => item.id}" 
//                 data-type="account"
//                 tabindex="${(_, c) => c.index + 2}"
//                 data-result-index="${(item, c) => c.index + 2}"
//                 @keydown="${(item, c) => c.parent.handleResultKeydown(item, c.event as KeyboardEvent)}"
//                 @mouseenter="${(item, c) => c.parent.handleItemMouseEnter(item)}"
//                 @click="${(item, c) => c.parent.selectItem(item)}">
//               <span class="item-badge account">Account</span>
//               <span class="item-name">${item => item.displayName}</span>
//               ${when(item => (item.originalItem as any).balance !== undefined, html`
//                 <span class="item-details">${item => (item.originalItem as any).balance.toFixed(2)} ${item => (item.originalItem as any).currency}</span>
//               `)}
//             </div>
//           `)}
//         `)}
        
//         ${when(x => x.filteredContacts.length > 0, html`
//           <div class="group-label">Payment Contacts</div>
//           ${repeat(x => x.filteredContacts, html`
//             <div class="${(item, c) => c.parent.getItemClasses(item)}" 
//                 data-id="${item => item.id}" 
//                 data-type="contact"
//                 tabindex="${(_, c) => c.parent.filteredAccounts.length + c.index + 2}"
//                 data-result-index="${(_, c) => c.parent.filteredAccounts.length + c.index + 2}"
//                 @keydown="${(item, c) => c.parent.handleResultKeydown(item, c.event as KeyboardEvent)}"
//                 @mouseenter="${(item, c) => c.parent.handleItemMouseEnter(item)}"
//                 @click="${(item, c) => c.parent.selectItem(item)}">
//               <span class="item-badge contact">Contact</span>
//               <span class="item-name">${item => item.displayName}</span>
//               ${when(item => (item.originalItem as any).accountNumber !== undefined, html`
//                 <span class="item-details">${item => (item.originalItem as any).accountNumber}</span>
//               `)}
//             </div>
//           `)}
//         `)}
        
//         ${when(x => x.showNewContactOption, html`
//           <div class="new-contact-option" 
//                @click="${x => x.createNewContact()}"
//                tabindex="${x => x.filteredAccounts.length + x.filteredContacts.length + 2}"
//                @keydown="${(x, c) => x.handleNewContactKeydown(c.event as KeyboardEvent)}"
//                @mouseenter="${x => x.isKeyboardNavigation = false}">
//             <span class="add-icon">+</span>
//             <span>Add New Contact</span>
//           </div>
//         `)}
        
//         ${when(x => x.filteredItems.length === 0 && !x.showNewContactOption, html`
//           <div class="no-results">
//             <p>No matches found</p>
//             <button type="button" 
//                    @click="${x => x.createNewContact()}" 
//                    class="add-new-button"
//                    tabindex="${x => x.filteredAccounts.length + x.filteredContacts.length + 2}">
//               Create New Contact
//             </button>
//           </div>
//         `)}
//       </div>
//     `)}
//   </div>
//   ${when(x => x.errorMessage, html`
//     <div class="error-message">${x => x.errorMessage}</div>
//   `)}
// </div>
// `;
