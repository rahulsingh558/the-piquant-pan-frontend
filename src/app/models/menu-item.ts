export interface Addon {
  id: number;
  name: string;
  price: number;
}

export type FoodType = 'veg' | 'egg' | 'nonveg';

export interface MenuItem {
  id: number;
  name: string;
  basePrice: number;
  type: FoodType;
  image: string;

  defaultAddons: Addon[]; // pre-checked
  extraAddons: Addon[];   // optional (paid)
}