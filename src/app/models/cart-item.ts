import { Addon } from './addon';

export interface CartItem {
  foodId: number;
  name: string;
  basePrice: number;
  addons: Addon[];
  quantity: number;
  totalPrice: number;
}
