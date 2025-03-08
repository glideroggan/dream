import { customElement, observable, attr } from '@microsoft/fast-element';
import { WorkflowBase } from '../workflow-base';
import { cardService } from '../../services/card-service';
import { repositoryService } from '../../services/repository-service';
import { template } from './card-detail-workflow.template';
import { styles } from './card-detail-workflow.styles';
import { Card } from '../../repositories/models/card-models';

@customElement({
  name: 'card-detail-workflow',
  template,
  styles,
})
export class CardDetailWorkflow extends WorkflowBase {
  @observable card: Card | null = null;
  @observable linkedAccountName: string = '';
  private cardRepo = repositoryService.getCardRepository();
  private accountRepo = repositoryService.getAccountRepository();

  @attr({ attribute: 'hide-actions', mode: 'boolean' })
  hideActions: boolean = false;

  async initialize(params?: Record<string, any>): Promise<void> {
    console.log('Initializing Card-detail-workflow with params:', params);
    this.setModalWidth('800px');
    this.updateTitle('Card Details');
    
    if (params?.card) {
      this.card = params.card;
      await this.loadLinkedAccountName();
    } else if (params?.cardId) {
      try {
        const loadedCard = await cardService.getCardById(params.cardId);
        if (loadedCard) {
          this.card = loadedCard;
          await this.loadLinkedAccountName();
        }
      } catch (error) {
        console.error('Error loading card:', error);
      }
    }
  }
  
  async loadLinkedAccountName(): Promise<void> {
    if (!this.card || !this.card.accountId) return;
    
    try {
      const account = await this.accountRepo.getById(this.card.accountId);
      this.linkedAccountName = account?.name || 'Unknown Account';
    } catch (error) {
      console.error('Error loading linked account:', error);
      this.linkedAccountName = 'Account Unavailable';
    }
  }
  
  formatCurrency(amount: number): string {
    return amount.toLocaleString();
  }
  
  formatCardNumber(cardNumber: string): string {
    // Format like XXXX-XXXX-XXXX-1234
    return cardNumber.replace(/(\d{4})/g, '$1-').replace(/-$/, '');
  }
  
  formatExpiryDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      // Format as MM/YY
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(2);
      
      return `${month}/${year}`;
    } catch (e) {
      console.error('Error formatting expiry date:', e);
      return dateString;
    }
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      // Format the date as Month Day, Year (e.g., January 15, 2023)
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(date);
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  }
  
  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  
  getStatusClass(status: string): string {
    return `status-${status}`;
  }
  
  getCardStatusClass(): string {
    return this.card?.type?.toLowerCase() + ' ' + (this.card?.status?.toLowerCase() || '');
  }
  
  capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  
  getNetworkLogo(): string {
    // This could be expanded to show different logos based on card number patterns
    // For now, we'll just use emoji representations
    if (!this.card) return '';
    
    // Check first digit of card number to determine network
    const firstDigit = this.card.cardNumber?.charAt(0);
    
    switch(firstDigit) {
      case '4': return '💳 Visa'; // Visa cards start with 4
      case '5': return '💳 MC';   // MasterCard typically starts with 5
      case '3': return '💳 Amex'; // American Express typically starts with 3
      case '6': return '💳 Disc'; // Discover typically starts with 6
      default: return '💳';
    }
  }
  
  async freezeCard(): Promise<void> {
    if (!this.card) return;
    
    try {
      // Update card status in repository
      await this.cardRepo.update(this.card.id, {
        ...this.card,
        status: 'frozen'
      });
      
      // Update local card object
      this.card = {
        ...this.card,
        status: 'frozen'
      };
      
      // Show success message
      this.dispatchEvent(new CustomEvent('notification', {
        bubbles: true,
        composed: true,
        detail: { 
          message: 'Card frozen successfully', 
          type: 'success' 
        }
      }));
    } catch (error) {
      console.error('Error freezing card:', error);
      this.dispatchEvent(new CustomEvent('notification', {
        bubbles: true,
        composed: true,
        detail: { 
          message: 'Failed to freeze card', 
          type: 'error' 
        }
      }));
    }
  }
  
  async unfreezeCard(): Promise<void> {
    if (!this.card) return;
    
    try {
      // Update card status in repository
      await this.cardRepo.update(this.card.id, {
        ...this.card,
        status: 'active'
      });
      
      // Update local card object
      this.card = {
        ...this.card,
        status: 'active'
      };
      
      // Show success message
      this.dispatchEvent(new CustomEvent('notification', {
        bubbles: true,
        composed: true,
        detail: { 
          message: 'Card unfrozen successfully', 
          type: 'success' 
        }
      }));
    } catch (error) {
      console.error('Error unfreezing card:', error);
      this.dispatchEvent(new CustomEvent('notification', {
        bubbles: true,
        composed: true,
        detail: { 
          message: 'Failed to unfreeze card', 
          type: 'error' 
        }
      }));
    }
  }
  
  async reportLostCard(): Promise<void> {
    if (!this.card) return;
    
    const result = await this.startNestedWorkflow('confirm-dialog', {
      title: 'Report Lost or Stolen Card',
      message: 'Are you sure you want to report this card as lost or stolen? This will permanently block the card and you will need to request a replacement.',
      confirmLabel: 'Report Card',
      cancelLabel: 'Cancel',
      isDestructive: true
    });
    
    if (result.success) {
      try {
        // Update card status in repository
        await this.cardRepo.update(this.card.id, {
          ...this.card,
          status: 'lost'
        });
        
        // Update local card object
        this.card = {
          ...this.card,
          status: 'lost'
        };
        
        // Show success message
        this.dispatchEvent(new CustomEvent('notification', {
          bubbles: true,
          composed: true,
          detail: { 
            message: 'Card reported lost successfully', 
            type: 'success' 
          }
        }));
      } catch (error) {
        console.error('Error reporting card as lost:', error);
        this.dispatchEvent(new CustomEvent('notification', {
          bubbles: true,
          composed: true,
          detail: { 
            message: 'Failed to report card', 
            type: 'error' 
          }
        }));
      }
    }
  }
  
  async changePIN(): Promise<void> {
    const result = await this.startNestedWorkflow('pin-change', {
      cardId: this.card?.id
    });
    
    if (result.success) {
      this.dispatchEvent(new CustomEvent('notification', {
        bubbles: true,
        composed: true,
        detail: { 
          message: 'PIN changed successfully', 
          type: 'success' 
        }
      }));
    }
  }
  
  async requestReplacement(): Promise<void> {
    if (!this.card) return;
    
    const result = await this.startNestedWorkflow('card', {
      action: 'replace',
      originalCardId: this.card.id,
      cardType: this.card.type,
      accountId: this.card.accountId
    });
    
    if (result.success) {
      this.complete(true, { cardReplaced: true });
    }
  }
}
