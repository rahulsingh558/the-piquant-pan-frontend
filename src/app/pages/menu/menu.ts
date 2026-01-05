import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CartService } from '../../services/cart';
import { FoodApiService, ApiFood } from '../../services/food-api.service';
import { Food } from '../../models/food';
import { Addon } from '../../models/addon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { ChatWidgetComponent } from '../../components/chat/chat.component';

/* =========================
   TYPES
========================= */
type FoodType = 'veg' | 'egg' | 'nonveg';

interface MenuFood extends Food {
  image: string;
  type: FoodType;
  freeAddonIds: number[];
  addons: Addon[];
}

/* =========================
   COMPONENT
========================= */
@Component({
  standalone: true,
  selector: 'app-menu',
  imports: [CommonModule, FontAwesomeModule, ChatWidgetComponent],
  templateUrl: './menu.html',
})
export class Menu {
  isBrowser = false;
  faCartPlus = faCartPlus;

  selectedType: 'all' | FoodType = 'all';
  foods: MenuFood[] = [];

  /* =========================
     MODAL STATE
  ========================== */
  showAddonModal = false;
  selectedFood!: MenuFood;
  modalSelectedFreeAddons: Addon[] = [];
  modalSelectedPremiumAddons: Addon[] = [];
  modalTotal = 0;

  /* =========================
     WISHLIST
  ========================== */
  wishlist: { id: any; name: string; basePrice: number }[] = [];

  /* =========================
     ADDON IMAGES
  ========================== */
  addonImages: { [key: string]: string } = {
    Onion: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200',
    Tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200',
    Cucumber: 'https://images.unsplash.com/photo-1582515081135-73c2c5298ac3?w=200',
    Lemon: 'https://images.unsplash.com/photo-1541692641319-981cc79ee10a?w=200',
    Coriander: 'https://images.unsplash.com/photo-1579118468075-5a8b7a9b4f03?w=200',
    'Sweet Corn': 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=200',
    Broccoli: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=200',
    Beans: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200',
    Peas: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200',
    Spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200',
    Capsicum: 'https://images.unsplash.com/photo-1596284244832-2de51e60d1c2?w=200',
    Cheese: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200',
    Mushroom: 'https://images.unsplash.com/photo-1485579148751-308a1fe6b0b5?w=200',
    'Bell Pepper': 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=200',
  };

  constructor(
    private cartService: CartService,
    private foodApi: FoodApiService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      this.loadMenu();
    }
  }

  /* =========================
     LOAD MENU (BACKEND)
  ========================== */
  loadMenu() {
    this.foodApi.getAllFoods().subscribe({
      next: foods => {
        this.foods = foods.map(f => this.mapApiFoodToMenu(f));
      },
      error: () => {
        this.foods = [];
      }
    });
  }

  /* =========================
     API → UI MAPPER
  ========================== */
  mapApiFoodToMenu(food: ApiFood): MenuFood {
    const freeAddons: Addon[] = [
      { id: 1, name: 'Onion', price: 0 },
      { id: 2, name: 'Tomato', price: 0 },
      { id: 3, name: 'Cucumber', price: 0 },
      { id: 4, name: 'Lemon', price: 0 },
      { id: 5, name: 'Coriander', price: 0 },
    ];

    let premiumAddons: Addon[] = [];

    if (food.type === 'veg' || food.type === 'egg') {
      premiumAddons = [
        { id: 6, name: 'Sweet Corn', price: 20 },
        { id: 7, name: 'Broccoli', price: 25 },
        { id: 8, name: 'Beans', price: 15 },
        { id: 9, name: 'Peas', price: 15 },
        { id: 10, name: 'Spinach', price: 20 },
        { id: 15, name: 'Bell Pepper', price: 15 },
      ];
    } else {
      premiumAddons = [
        { id: 11, name: 'Capsicum', price: 20 },
        { id: 12, name: 'Broccoli', price: 25 },
        { id: 13, name: 'Cheese', price: 30 },
        { id: 14, name: 'Mushroom', price: 25 },
        { id: 16, name: 'Bell Pepper', price: 15 },
      ];
    }

    return {
      id: food._id as any,
      name: food.name,
      subtitle: food.subtitle,
      basePrice: food.basePrice,
      category: food.category as 'sprouts' | 'airfried',
      type: food.type,
      image: `http://localhost:5001${food.image}`,
      addons: [...freeAddons, ...premiumAddons],
      freeAddonIds: freeAddons.map(a => a.id),
    };
  }

  /* =========================
     FILTER
  ========================== */
  get filteredFoods() {
    if (this.selectedType === 'all') return this.foods;
    return this.foods.filter(f => f.type === this.selectedType);
  }

  /* =========================
     ADDON HELPERS
  ========================== */
  getFreeAddons(food: MenuFood) {
    return food.addons.filter(a => a.price === 0);
  }

  getPremiumAddons(food: MenuFood) {
    return food.addons.filter(a => a.price > 0);
  }

  isFreeAddonSelected(id: number): boolean {
    return this.modalSelectedFreeAddons.some(a => a.id === id);
  }

  isPremiumAddonSelected(id: number): boolean {
    return this.modalSelectedPremiumAddons.some(a => a.id === id);
  }

  getAddonImage(name: string) {
    return this.addonImages[name];
  }

  getPremiumAddonsTotal() {
    return this.modalSelectedPremiumAddons.reduce((s, a) => s + a.price, 0);
  }

  /* =========================
     WISHLIST
  ========================== */
  toggleWishlist(food: Food) {
    const i = this.wishlist.findIndex(w => w.id === food.id);
    i > -1 ? this.wishlist.splice(i, 1) : this.wishlist.push(food as any);
    localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
  }

  isWishlisted(id: any) {
    return this.wishlist.some(w => w.id === id);
  }

  /* =========================
     ADD TO CART
  ========================== */
  openAddonPopup(food: MenuFood) {
    this.selectedFood = food;
    this.modalSelectedFreeAddons = [...this.getFreeAddons(food)];
    this.modalSelectedPremiumAddons = [];
    this.calculateTotal();
    this.showAddonModal = true;
  }

  closeAddonPopup() {
    this.showAddonModal = false;
    this.modalSelectedFreeAddons = [];
    this.modalSelectedPremiumAddons = [];
  }

  toggleFreeAddon(addon: Addon) {
    const i = this.modalSelectedFreeAddons.findIndex(a => a.id === addon.id);
    i > -1
      ? this.modalSelectedFreeAddons.splice(i, 1)
      : this.modalSelectedFreeAddons.push(addon);
    this.calculateTotal();
  }

  togglePremiumAddon(addon: Addon) {
    const i = this.modalSelectedPremiumAddons.findIndex(a => a.id === addon.id);
    i > -1
      ? this.modalSelectedPremiumAddons.splice(i, 1)
      : this.modalSelectedPremiumAddons.push(addon);
    this.calculateTotal();
  }

  calculateTotal() {
    this.modalTotal =
      this.selectedFood.basePrice +
      this.modalSelectedPremiumAddons.reduce((s, a) => s + a.price, 0);
  }

  confirmAddToCart() {
    this.cartService.addToCart({
      foodId: this.selectedFood.id,
      name: this.selectedFood.name,
      basePrice: this.selectedFood.basePrice,
      addons: [...this.modalSelectedFreeAddons, ...this.modalSelectedPremiumAddons],
      quantity: 1,
      totalPrice: this.modalTotal,
    });
    this.closeAddonPopup();
  }
}