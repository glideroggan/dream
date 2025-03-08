import { customElement, observable } from "@microsoft/fast-element";
import { WorkflowBase, WorkflowResult } from "../workflow-base";
import { template } from "./card-workflow.template";
import { styles } from "./card-workflow.css";
import { cardService } from "../../services/card-service";
import { repositoryService } from "../../services/repository-service";
import { CardProduct } from "../../repositories/models/card-models";

export interface UserAccount {
    id: string;
    name: string;
    type: string;
    compatibleWithDebitCard: boolean;
}

@customElement({
    name: "card-workflow",
    template,
    styles
})
export class CardWorkflow extends WorkflowBase {
    @observable isLoading: boolean = true;
    @observable cardTypeSelected: boolean = false;
    @observable tempCardType: "credit" | "debit" | null = null;
    @observable selectedProduct: CardProduct | null = null;
    @observable availableAccounts: UserAccount[] = [];
    @observable selectedAccountId: string | null = null;
    @observable hasSelectedCardBefore: boolean = false;
    @observable isProductAdded: boolean = false;
    @observable agreementChecked: boolean = false;
    @observable showValidationErrors: boolean = false;
    @observable accountSelectError: string | null = null;
    @observable userKycStatus: string = "basic-customer";
    @observable userCreditScore: number = 700;
    @observable userAge: number = 25;
    
    // Reference to credit and debit card products that will be loaded from service
    private creditCardProduct: CardProduct | null = null;
    private debitCardProduct: CardProduct | null = null;

    private unsubscribeToAccounts: (() => void) | null = null;

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.unsubscribeToAccounts?.call(this);
    }

    async initialize(params?: Record<string, any>): Promise<void> {
        console.debug("Initializing CardWorkflow with params:", params);
        this.isLoading = true;
        
        // Setup the workflow UI
        this.updateTitle("Request a New Card");
        
        // Initialize the footer with Continue button but disabled initially
        this.updateFooter(true, "Continue");
        this.notifyValidation(false);

        const accountRepo = repositoryService.getAccountRepository()
        this.unsubscribeToAccounts = accountRepo.subscribe(() => {
            this.loadUserAccounts();
        });
        
        try {
            // Load card products first
            await this.loadCardProducts();
            
            // If product ID is provided, load that specific product
            if (params?.productId) {
                await this.selectProductById(params.productId);
            }
            // If card type is provided in params, preselect it
            else if (params?.cardType && (params.cardType === 'credit' || params.cardType === 'debit')) {
                this.tempCardType = params.cardType;
                await this.selectCardType(params.cardType);
            }

            // Initialize user status info
            await this.updateUserInfo();
        } catch (error) {
            console.error("Error during card workflow initialization:", error);
        } finally {
            this.isLoading = false;
            
            // Ensure footer is updated appropriately
            if (!this.cardTypeSelected) {
                // Initial state - just selecting card type
                this.updateFooter(true, "Continue");
                this.notifyValidation(!!this.tempCardType); // Valid if type is selected
            } else if (this.hasSelectedCardBefore) {
                // Card already active
                this.updateFooter(true, "Close");
                this.notifyValidation(true);
            } else {
                // Card selected but not yet requested
                this.updateFooter(true, "Request Card");
                this.notifyValidation(this.validateForm());
            }
        }
    }

    async loadCardProducts(): Promise<void> {
        try {
            // Get card products from service
            const products = await cardService.getCardProducts();
            console.log("[loadCardProducts]", products);
            
            if (products.length > 0) {
                // Find credit and debit products
                const creditProduct = products.find(p => p.type === 'credit');
                const debitProduct = products.find(p => p.type === 'debit');
                
                if (creditProduct) {
                    this.creditCardProduct = creditProduct;
                }
                
                if (debitProduct) {
                    this.debitCardProduct = debitProduct;
                }
                
                console.debug("Loaded card products:", products);
            } else {
                console.warn("No card products found");
            }
        } catch (error) {
            console.error("Error loading card products:", error);
        }
    }
    
    async selectProductById(productId: string): Promise<void> {
        // We need to make sure products are loaded
        if (!this.creditCardProduct || !this.debitCardProduct) {
            await this.loadCardProducts();
        }
        
        // Determine product type based on ID for selection
        if (this.creditCardProduct && productId === this.creditCardProduct.id) {
            this.selectedProduct = this.creditCardProduct;
            this.tempCardType = 'credit';
            this.cardTypeSelected = true;
        } else if (this.debitCardProduct && productId === this.debitCardProduct.id) {
            this.selectedProduct = this.debitCardProduct;
            this.tempCardType = 'debit';
            this.cardTypeSelected = true;
            await this.loadUserAccounts();
        }
        
        // Check if user already has this product
        if (this.selectedProduct) {
            const hasProduct = await cardService.userHasCard(this.selectedProduct.id);
            this.hasSelectedCardBefore = hasProduct;
            
            if (hasProduct) {
                this.updateFooter(true, "Close");
            } else {
                this.updateFooter(true, "Request Card");
                this.notifyValidation(this.validateForm());
            }
        }
    }
    
    async updateUserInfo(): Promise<void> {
        // Here we could fetch user KYC status, credit score, etc.
    }

    async selectCardType(type: "credit" | "debit"): Promise<void> {
        console.debug(`Selecting card type: ${type}`);
        this.tempCardType = type;
        this.isLoading = true; // Show loading while we prepare everything
        
        try {
            // Make sure products are loaded
            if (!this.creditCardProduct || !this.debitCardProduct) {
                await this.loadCardProducts();
            }
            
            if (!this.creditCardProduct || !this.debitCardProduct) {
                console.error("Failed to load card products");
                return;
            }
            
            // Set selected product based on type
            this.selectedProduct = type === 'credit' ? this.creditCardProduct : this.debitCardProduct;
            
            console.debug("Selected product set:", this.selectedProduct);
            
            // For debit cards, we need to load available accounts
            if (type === 'debit') {
                await this.loadUserAccounts();
            }

            // Now that everything is loaded, mark the type as selected
            // This ensures the UI won't try to render with incomplete data
            this.cardTypeSelected = true;
            
            // Update UI
            this.updateTitle(`Request ${type === 'credit' ? 'Credit' : 'Debit'} Card`);

            // Check if user already has this card
            if (this.selectedProduct) {
                const hasCard = await cardService.userHasCard(this.selectedProduct.id);
                this.hasSelectedCardBefore = hasCard;
                
                if (hasCard) {
                    this.updateFooter(true, "Close");
                    this.notifyValidation(true);
                } else {
                    this.updateFooter(true, "Request Card");
                    this.notifyValidation(this.validateForm());
                }
            }
        } catch (error) {
            console.error(`Error selecting card type ${type}:`, error);
        } finally {
            this.isLoading = false;
        }
    }

    private async loadUserAccounts(): Promise<void> {
        try {
            // Get compatible accounts from service
            const accounts = await cardService.getCompatibleAccounts();
            
            // Convert to UserAccount format
            this.availableAccounts = accounts.map(account => ({
                id: account.id,
                name: account.name,
                type: account.type,
                compatibleWithDebitCard: true
            }));
            
            console.debug(`Loaded ${this.availableAccounts.length} compatible accounts`);
        } catch (error) {
            console.error("Error loading user accounts:", error);
            this.availableAccounts = [];
        }
    }

    get meetsAllRequirements(): boolean {
        if (!this.selectedProduct) return false;

        for (const req of this.selectedProduct.requirements) {
            if (!this.requirementMet(req.type)) {
                return false;
            }
        }

        // For debit cards, also check if an account is selected
        if (this.selectedProduct.type === 'debit' && !this.selectedAccountId && this.availableAccounts.length > 0) {
            return false;
        }

        return true;
    }

    requirementMet(requirementType: string): boolean {
        if (!this.selectedProduct) return false;

        const requirement = this.selectedProduct.requirements.find(r => r.type === requirementType);
        if (!requirement) return true;

        switch (requirementType) {
            case "kyc":
                // Basic check for KYC level
                return this.userKycStatus === requirement.value ||
                    (requirement.value === "basic-customer" &&
                        ["enhanced-customer", "premium-customer"].includes(this.userKycStatus));
            case "creditScore":
                return this.userCreditScore >= requirement.value;
            case "age":
                return this.userAge >= requirement.value;
            case "hasAccount":
                return this.availableAccounts.length > 0;
            default:
                return true;
        }
    }

    handleAccountSelection(event: Event): void {
        const target = event.target as HTMLSelectElement;
        this.selectedAccountId = target.value;
        this.accountSelectError = null;

        this.validateForm();
    }

    toggleAgreement(): void {
        if (this.hasSelectedCardBefore) return;

        this.agreementChecked = !this.agreementChecked;
        this.validateForm();
    }

    validateForm(): boolean {
        // If user already has the card, form is always valid
        if (this.hasSelectedCardBefore) {
            this.notifyValidation(true);
            return true;
        }

        // First check if all requirements are met
        if (!this.meetsAllRequirements) {
            this.notifyValidation(false, "You don't meet all requirements for this card");
            return false;
        }

        // For debit cards, validate account selection
        if (this.selectedProduct?.type === 'debit' && this.availableAccounts.length > 0) {
            if (!this.selectedAccountId) {
                this.accountSelectError = "Please select an account";
                this.notifyValidation(false, "Please select an account to link with your debit card");
                return false;
            }
        }

        // Finally check agreement
        const isValid = this.agreementChecked;
        this.notifyValidation(isValid, isValid ? undefined : "Please agree to terms and conditions");
        return isValid;
    }

    handleCreateAccount(): void {
        // Handle create account workflow
        this.startNestedWorkflow("create-account").then(result => {
            if (result.success) {
                // Reload accounts after successful account creation
                this.loadUserAccounts();
            }
        });
    }

    formatPrice(price: number): string {
        return price.toFixed(2);
    }

    public async handlePrimaryAction(): Promise<void> {
        console.debug("Primary action triggered");

        // If card type not selected yet, confirm selection and move to next step
        if (!this.cardTypeSelected && this.tempCardType) {
            console.debug("Selecting card type:", this.tempCardType);
            this.selectCardType(this.tempCardType);
            return;
        }

        // If card is already active, just close the workflow
        if (this.hasSelectedCardBefore) {
            this.complete(true, {
                productId: this.selectedProduct?.id,
                alreadyActive: true
            }, "Card is already active on your account");
            return;
        }

        // Otherwise, validate and add card
        this.showValidationErrors = true;

        if (this.validateForm()) {
            await this.requestCard();
        }
    }

    /**
     * Called when secondary button (Cancel) is clicked
     */
    public handleCancelAction(): void {
        console.debug("Cancel button clicked");
        this.cancel("Card request cancelled");
    }

    /**
     * Submit the card request to the backend
     */
    private async requestCard(): Promise<void> {
        if (!this.selectedProduct) return;

        try {
            this.isLoading = true;

            // Prepare card request data
            const cardRequestData = {
                productId: this.selectedProduct.id,
                cardType: this.selectedProduct.type,
                linkedAccountId: this.selectedProduct.type === 'debit' ? this.selectedAccountId : null,
                requestDate: new Date().toISOString()
            };

            // Send request to card service
            const result = await cardService.requestCard(cardRequestData);
            console.log("Card request result:", result);
            
            if (result.success) {
                // Show success message
                this.isProductAdded = true;

                // Update UI
                this.updateFooter(true, "Close");
                
                // Complete workflow
                this.complete(true, {
                    productId: this.selectedProduct?.id,
                    cardType: this.selectedProduct.type,
                    linkedAccountId: cardRequestData.linkedAccountId,
                    requestDate: cardRequestData.requestDate
                }, `${this.selectedProduct.type === 'credit' ? 'Credit' : 'Debit'} card requested successfully`);
            } else {
                this.complete(false, undefined, result.message || "Failed to request card");
            }
        } catch (error) {
            console.error("Error requesting card:", error);
            this.complete(false, undefined, "Failed to request card. Please try again.");
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Handle resuming after a nested workflow completes 
     * (e.g., if we need to start a KYC workflow for card verification)
     */
    public resume(result?: WorkflowResult): void {
        console.debug("Card workflow resumed after nested workflow", result);

        // Restore the original UI state
        if (this.selectedProduct) {
            this.updateTitle(`Request ${this.selectedProduct.type === 'credit' ? 'Credit' : 'Debit'} Card`);
        } else {
            this.updateTitle("Request a New Card");
        }

        if (this.hasSelectedCardBefore) {
            this.updateFooter(true, "Close");
        } else {
            this.updateFooter(true, "Request Card");
        }

        if (result?.success) {
            // Handle successful completion of the nested workflow
            console.debug("Nested workflow completed successfully:", result);

            // If the nested workflow was a KYC verification that succeeded,
            // we might need to update the KYC status
            if (result.data?.workflow === 'kyc' && result.data?.verified) {
                this.userKycStatus = result.data.kycLevel || this.userKycStatus;
                console.debug("KYC status updated to:", this.userKycStatus);
            }

            // Validate form again to update requirements status
            this.validateForm();
        } else {
            console.debug("Nested workflow was cancelled or failed");
        }
    }
}
