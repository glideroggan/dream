import { Entity } from "../base-repository";
import { Product } from "./product-models";

// TODO: we need different states for different products, but this is for the actual service
// when it comes to card for example, you can have a card that is inactive, frozen, but the 
// service is still active

export interface UserProduct extends Entity, Product {
    active: boolean;
    addedDate: string;
    lastUpdated: string;
}