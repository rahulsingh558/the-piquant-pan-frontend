import { Component, Inject, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CartService, CartItem } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { FoodApiService, ApiFood } from '../../services/food-api.service';
import { Addon } from '../../models/addon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCartPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { environment } from '../../../environments/environment';

/* =========================
   TYPES
========================= */
type FoodType = 'veg' | 'egg' | 'nonveg';
type CuisineFilter = 'all' | 'chinese' | 'north_indian' | 'veg_curry' | 'nonveg_curry' | 'snacks' | 'starters' | 'rice' | 'thali' | 'beverages' | 'healthy' | 'noodles' | 'maggi';

interface MenuFood {
  id: any;
  name: string;
  subtitle?: string;
  basePrice: number;
  category: string;
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
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './menu.html',
})
export class Menu implements OnInit {
  isBrowser = false;
  faCartPlus = faCartPlus;
  faCheck = faCheck;
  cartItems: CartItem[] = [];

  selectedType: 'all' | FoodType = 'all';
  selectedCuisine: CuisineFilter = 'all';
  foods: MenuFood[] = [];

  /* =========================
     CUISINE FILTERS CONFIG
  ========================== */
  cuisineFilters: { key: CuisineFilter; label: string; icon: string; color: string }[] = [
    { key: 'all', label: 'All', icon: '🍽️', color: 'bg-gradient-to-r from-orange-500 to-red-500' },
    { key: 'chinese', label: 'Chinese', icon: '🥢', color: 'bg-gradient-to-r from-red-600 to-red-700' },
    { key: 'north_indian', label: 'North Indian', icon: '🍛', color: 'bg-gradient-to-r from-amber-500 to-orange-600' },
    { key: 'veg_curry', label: 'Veg Curry', icon: '🥬', color: 'bg-gradient-to-r from-green-500 to-emerald-600' },
    { key: 'nonveg_curry', label: 'Non-Veg Curry', icon: '🍗', color: 'bg-gradient-to-r from-red-500 to-rose-600' },
    { key: 'snacks', label: 'Snacks', icon: '🍟', color: 'bg-gradient-to-r from-yellow-500 to-amber-500' },
    { key: 'starters', label: 'Starters', icon: '🥗', color: 'bg-gradient-to-r from-lime-500 to-green-500' },
    { key: 'rice', label: 'Rice & Biryani', icon: '🍚', color: 'bg-gradient-to-r from-amber-400 to-yellow-500' },
    { key: 'noodles', label: 'Noodles', icon: '🍜', color: 'bg-gradient-to-r from-orange-400 to-amber-500' },
    { key: 'thali', label: 'Thali', icon: '🍱', color: 'bg-gradient-to-r from-purple-500 to-indigo-600' },
    { key: 'beverages', label: 'Beverages', icon: '☕', color: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
    { key: 'healthy', label: 'Healthy', icon: '🥦', color: 'bg-gradient-to-r from-teal-500 to-green-500' },
  ];

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
    private wishlistService: WishlistService,
    private foodApi: FoodApiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      // Subscribe to wishlist service
      this.wishlistService.wishlist$.subscribe(items => {
        this.wishlist = items;
      });
    }
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadMenu();

      // Subscribe to cart updates
      this.cartService.cart$.subscribe(cart => {
        this.cartItems = cart.items;
      });
    }
  }

  /* =========================
     LOAD MENU (BACKEND)
  ========================== */
  loadMenu() {
    this.foodApi.getAllFoods().subscribe({
      next: foods => {
        this.foods = foods.map(f => this.mapApiFoodToMenu(f));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Menu] Error loading menu:', err);
        this.foods = [];
        this.cdr.detectChanges();
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
      category: food.category,
      type: food.type,
      image: `${environment.backendUrl}${food.image}`,
      addons: [...freeAddons, ...premiumAddons],
      freeAddonIds: freeAddons.map(a => a.id),
    };
  }

  /* =========================
     FILTER
  ========================== */
  get filteredFoods() {
    let filtered = this.foods;

    // Apply type filter (veg/egg/nonveg)
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(f => f.type === this.selectedType);
    }

    // Apply cuisine/category filter
    if (this.selectedCuisine !== 'all') {
      filtered = filtered.filter(f => this.matchesCuisineFilter(f));
    }

    return filtered;
  }

  /* =========================
     CUISINE MATCHING LOGIC
  ========================== */
  private matchesCuisineFilter(food: MenuFood): boolean {
    const name = food.name.toLowerCase();
    const category = food.category.toLowerCase();

    switch (this.selectedCuisine) {
      case 'chinese':
        // Chinese/Indo-Chinese items
        return name.includes('manchurian') ||
          name.includes('chilli') ||
          name.includes('noodles') ||
          name.includes('fried rice') ||
          name.includes('65') || // Chicken 65, Paneer 65
          category === 'noodles';

      case 'north_indian':
        // North Indian items
        return name.includes('dal') ||
          name.includes('paneer') ||
          name.includes('biryani') ||
          name.includes('curry') ||
          name.includes('tikka') ||
          name.includes('masala') ||
          name.includes('chole') ||
          name.includes('rajma') ||
          name.includes('palak') ||
          name.includes('roti') ||
          category === 'gravy' ||
          category === 'thali';

      case 'veg_curry':
        // Veg curry items
        return category === 'gravy' && food.type === 'veg';

      case 'nonveg_curry':
        // Non-veg curry items
        return category === 'gravy' && (food.type === 'nonveg' || food.type === 'egg');

      case 'snacks':
        return category === 'snacks';

      case 'starters':
        return category === 'starter';

      case 'rice':
        return category === 'rice';

      case 'noodles':
        return category === 'noodles';

      case 'maggi':
        return category === 'maggi';

      case 'thali':
        return category === 'thali';

      case 'beverages':
        return category === 'beverages';

      case 'healthy':
        return category === 'healthy';

      default:
        return true;
    }
  }

  selectCuisine(cuisine: CuisineFilter) {
    this.selectedCuisine = cuisine;
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
  toggleWishlist(food: MenuFood) {
    if (this.isWishlisted(food.id)) {
      this.wishlistService.removeFromWishlist(food.id);
    } else {
      this.wishlistService.addToWishlist({
        id: food.id,
        name: food.name,
        basePrice: food.basePrice
      });
    }
  }

  isWishlisted(id: any) {
    return this.wishlistService.isInWishlist(id);
  }

  /* =========================
     ADD TO CART
  ========================== */
  addToCart(food: MenuFood) {
    const result = this.cartService.addToCart({
      menuItemId: String(food.id),
      name: food.name,
      price: food.basePrice,
      quantity: 1,
      customizations: {}
    });

    // Subscribe if it's an observable (logged-in user)
    if (result && typeof result.subscribe === 'function') {
      result.subscribe({
        next: () => {
          console.log('Item added to cart');
          this.cdr.detectChanges(); // Trigger change detection
          // Optional: Show a toast notification here
        },
        error: (err: any) => console.error('Error adding to cart:', err)
      });
    } else {
      // For guest users (non-observable)
      this.cdr.detectChanges(); // Trigger change detection
    }
  }

  isInCart(food: MenuFood): boolean {
    return this.cartItems.some(item => item.menuItemId === String(food.id));
  }

  // Legacy methods - can be removed if addon feature is no longer needed
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
    const result = this.cartService.addToCart({
      menuItemId: String(this.selectedFood.id),
      name: this.selectedFood.name,
      price: this.modalTotal,
      quantity: 1,
      customizations: {
        freeAddons: this.modalSelectedFreeAddons,
        premiumAddons: this.modalSelectedPremiumAddons
      }
    });

    // Subscribe if it's an observable (logged-in user)
    if (result && typeof result.subscribe === 'function') {
      result.subscribe({
        next: () => console.log('Item added to cart'),
        error: (err: any) => console.error('Error adding to cart:', err)
      });
    }

    this.closeAddonPopup();
  }
}