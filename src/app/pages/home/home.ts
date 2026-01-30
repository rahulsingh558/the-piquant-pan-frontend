import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  signal,
  OnInit
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { ProductsCarouselComponent } from '../../components/products-carousel/products-carousel.component';
import { FoodApiService, ApiFood } from '../../services/food-api.service';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  templateUrl: './home.html',
  imports: [
    RouterLink,
    CommonModule,
    ProductsCarouselComponent
  ],
})
export class Home implements AfterViewInit, OnInit {
  private isBrowser = false;
  wishlist: WishlistItem[] = [];

  /* =========================
     ROTATING BOWL STATE
  ========================== */
  activeBowlIndex = signal(0);
  isBowlAnimating = signal(false);

  bowls: BowlType[] = [
    {
      type: 'sprouts',
      title: 'Fresh Sprouts Power Bowl',
      description: 'Protein-packed moong sprouts with fresh vegetables and lemon dressing. Perfect for weight management and digestion.',
      calories: '320 cal',
      ingredients: ['Moong Sprouts', 'Cucumber', 'Tomato', 'Bell Pepper', 'Onion', 'Lemon Dressing'],
      image: 'https://images.unsplash.com/photo-1540420828642-fca2c5c18abe?w=800&h=800&fit=crop&crop=center',
      basePrice: 99
    },
    {
      type: 'egg',
      title: 'Egg Protein Bowl',
      description: 'Boiled eggs with quinoa, avocado, and roasted vegetables. High protein meal for muscle recovery.',
      calories: '420 cal',
      ingredients: ['Boiled Eggs', 'Quinoa', 'Avocado', 'Spinach', 'Cherry Tomatoes', 'Herb Dressing'],
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop&crop=center',
      basePrice: 129
    },
    {
      type: 'paneer',
      title: 'Air Fried Paneer Bowl',
      description: 'Crispy air-fried paneer with sweet corn mix. 95% less oil than traditional frying.',
      calories: '380 cal',
      ingredients: ['Air Fried Paneer', 'Sweet Corn', 'Capsicum', 'Onion', 'Mexican Seasoning', 'Yogurt Dip'],
      image: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=800&h=800&fit=crop&crop=center',
      basePrice: 149
    },
    {
      type: 'chicken',
      title: 'Grilled Chicken Protein Bowl',
      description: 'Grilled chicken breast with broccoli and roasted vegetables. Perfect post-workout meal.',
      calories: '450 cal',
      ingredients: ['Grilled Chicken', 'Broccoli', 'Bell Pepper', 'Sweet Potato', 'Brown Rice', 'Herb Sauce'],
      image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&h=800&fit=crop&crop=center',
      basePrice: 169
    }
  ];

  /* =========================
     MENU ITEMS FOR CAROUSELS
  ========================== */
  mostSellingItems: MenuItem[] = [];
  chefSpecialItems: MenuItem[] = [];
  starterItems: MenuItem[] = [];
  vegetarianItems: MenuItem[] = [];
  nonVegItems: MenuItem[] = [];

  /* =========================
     CAROUSEL STATE
  ========================== */
  activeTestimonialIndex = signal(0);
  activeChefSpecialIndex = signal(0);
  activeStarterIndex = signal(0);
  activeVegetarianIndex = signal(0);
  activeNonVegIndex = signal(0);

  /* =========================
     FOOD ORDERING BENEFITS
  ========================== */
  foodBenefits = [
    {
      icon: '🍴',
      title: 'Wide Variety',
      description: 'Diverse cuisines and dishes to satisfy every craving'
    },
    {
      icon: '🚀',
      title: 'Fast Delivery',
      description: 'Hot and fresh meals delivered in 25 minutes or less'
    },
    {
      icon: '⭐',
      title: 'Premium Quality',
      description: 'Top-quality ingredients and expert preparation every time'
    },
    {
      icon: '🎯',
      title: 'Easy Customization',
      description: 'Personalize your meals exactly how you like them'
    }
  ];

  testimonials: Testimonial[] = [
    {
      name: 'Priya Sharma',
      role: 'Food Blogger',
      text: 'The Piquant Pan never disappoints! Every dish is bursting with flavor and the variety keeps me coming back. Best food delivery in town!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face'
    },
    {
      name: 'Rohan Mehta',
      role: 'IT Professional',
      text: 'Working long hours made finding good food tough. The Piquant Pan delivers amazing meals right to my desk. The flavors are incredible!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'
    },
    {
      name: 'Ananya Reddy',
      role: 'Chef',
      text: 'As a professional chef, I appreciate the attention to detail and quality ingredients. The Piquant Pan has mastered the art of delivery without compromising taste.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face'
    }
  ];

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private cartService: CartService,
    private foodApiService: FoodApiService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.wishlist = JSON.parse(
        localStorage.getItem('wishlist') || '[]'
      );
    }
  }

  /* =========================
     ROTATING BOWL FUNCTIONS
  ========================== */
  get activeBowl(): BowlType {
    return this.bowls[this.activeBowlIndex()];
  }

  nextBowl(): void {
    if (this.isBowlAnimating()) return;

    this.isBowlAnimating.set(true);
    this.activeBowlIndex.update(current => (current + 1) % this.bowls.length);

    setTimeout(() => this.isBowlAnimating.set(false), 600);
  }

  prevBowl(): void {
    if (this.isBowlAnimating()) return;

    this.isBowlAnimating.set(true);
    this.activeBowlIndex.update(current =>
      current === 0 ? this.bowls.length - 1 : current - 1
    );

    setTimeout(() => this.isBowlAnimating.set(false), 600);
  }

  goToBowl(index: number): void {
    if (this.isBowlAnimating() || index === this.activeBowlIndex()) return;

    this.isBowlAnimating.set(true);
    this.activeBowlIndex.set(index);
    setTimeout(() => this.isBowlAnimating.set(false), 600);
  }

  toTitleCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /* =========================
     TESTIMONIAL CAROUSEL
  ========================== */
  nextTestimonial(): void {
    this.activeTestimonialIndex.update(current =>
      (current + 1) % this.testimonials.length
    );
  }

  prevTestimonial(): void {
    this.activeTestimonialIndex.update(current =>
      current === 0 ? this.testimonials.length - 1 : current - 1
    );
  }

  goToTestimonial(index: number): void {
    this.activeTestimonialIndex.set(index);
  }

  get activeTestimonial(): Testimonial {
    return this.testimonials[this.activeTestimonialIndex()];
  }

  getStars(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  /* =========================
     CART
  ========================== */
  addToCartFromHome(food: {
    foodId: string | number;
    name: string;
    basePrice: number;
  }) {
    const result = this.cartService.addToCart({
      menuItemId: String(food.foodId),
      name: food.name,
      price: food.basePrice,
      quantity: 1,
      customizations: {}
    });

    if (result && typeof result.subscribe === 'function') {
      result.subscribe({
        next: () => console.log('Item added to cart'),
        error: (err: any) => console.error('Error adding to cart:', err)
      });
    }
  }

  /* =========================
     WISHLIST
  ========================== */
  toggleWishlist(item: WishlistItem) {
    if (!this.isBrowser) return;

    const index = this.wishlist.findIndex(i => i.id === item.id);

    if (index > -1) {
      this.wishlist.splice(index, 1);
    } else {
      this.wishlist.push(item);
    }

    localStorage.setItem(
      'wishlist',
      JSON.stringify(this.wishlist)
    );
  }

  isWishlisted(id: number): boolean {
    return this.wishlist.some(item => item.id === id);
  }

  /* =========================
     SCROLL ANIMATIONS
  ========================== */
  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    setTimeout(() => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-show');
          }
        });
      });

      elements.forEach(el => observer.observe(el));
    }, 0);
  }

  ngOnInit(): void {
    this.initializeMenuItems();
  }

  initializeMenuItems(): void {
    this.foodApiService.getAllFoods().subscribe({
      next: (foods) => {
        // Map ApiFood to MenuItem and populate lists
        const menuItems: MenuItem[] = foods.map(food => ({
          id: food._id,
          name: food.name,
          subtitle: food.subtitle,
          basePrice: food.basePrice,
          calories: food.calories,
          type: food.type as 'veg' | 'nonveg' | 'egg',
          category: food.category,
          image: `${environment.backendUrl}${food.image}`,
          isBestSeller: false,
          discountPrice: null
        }));

        // Populate Categories
        this.mostSellingItems = menuItems.slice(0, 8); // Just take first 8 as most selling for now
        this.chefSpecialItems = menuItems.filter((_, i) => i % 3 === 0).slice(0, 4); // Simulate random selection
        this.starterItems = menuItems.filter(item => item.category === 'starter');
        this.vegetarianItems = menuItems.filter(item => item.type === 'veg');
        this.nonVegItems = menuItems.filter(item => item.type === 'nonveg');
      },
      error: (err) => console.error('Error fetching foods:', err)
    });
  }

  /* =========================
     CAROUSEL NAVIGATION FUNCTIONS
  ========================== */
  nextCarousel(carouselType: string): void {
    switch (carouselType) {
      case 'mostSelling':
        if (this.isBrowser) {
          const container = document.querySelector('.most-selling-carousel');
          if (container) {
            container.scrollBy({ left: 350, behavior: 'smooth' });
          }
        }
        break;
      case 'chefSpecial':
        this.activeChefSpecialIndex.update(current =>
          (current + 1) % this.chefSpecialItems.length
        );
        break;
      case 'starter':
        if (this.isBrowser) {
          const container = document.querySelector('.starter-carousel');
          if (container) {
            container.scrollBy({ left: 300, behavior: 'smooth' });
          }
        }
        break;
      case 'vegetarian':
        this.activeVegetarianIndex.update(current =>
          (current + 1) % this.vegetarianItems.length
        );
        break;
      case 'nonVeg':
        this.activeNonVegIndex.update(current =>
          (current + 1) % this.nonVegItems.length
        );
        break;
    }
  }

  prevCarousel(carouselType: string): void {
    switch (carouselType) {
      case 'mostSelling':
        if (this.isBrowser) {
          const container = document.querySelector('.most-selling-carousel');
          if (container) {
            container.scrollBy({ left: -350, behavior: 'smooth' });
          }
        }
        break;
      case 'chefSpecial':
        this.activeChefSpecialIndex.update(current =>
          current === 0 ? this.chefSpecialItems.length - 1 : current - 1
        );
        break;
      case 'starter':
        if (this.isBrowser) {
          const container = document.querySelector('.starter-carousel');
          if (container) {
            container.scrollBy({ left: -300, behavior: 'smooth' });
          }
        }
        break;
      case 'vegetarian':
        this.activeVegetarianIndex.update(current =>
          current === 0 ? this.vegetarianItems.length - 1 : current - 1
        );
        break;
      case 'nonVeg':
        this.activeNonVegIndex.update(current =>
          current === 0 ? this.nonVegItems.length - 1 : current - 1
        );
        break;
    }
  }

  goToSlide(carouselType: string, index: number): void {
    switch (carouselType) {
      case 'chefSpecial':
        this.activeChefSpecialIndex.set(index);
        break;
      case 'starter':
        this.activeStarterIndex.set(index);
        break;
      case 'vegetarian':
        this.activeVegetarianIndex.set(index);
        break;
      case 'nonVeg':
        this.activeNonVegIndex.set(index);
        break;
    }
  }
}

interface WishlistItem {
  id: number;
  name: string;
  price: number;
}

interface BowlType {
  type: 'sprouts' | 'egg' | 'paneer' | 'chicken';
  title: string;
  description: string;
  calories: string;
  ingredients: string[];
  image: string;
  basePrice: number;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
  avatar: string;
}

interface MenuItem {
  id: string; // Changed from number to string for MongoDB _id
  name: string;
  subtitle: string;
  basePrice: number;
  calories: number;
  type: 'veg' | 'nonveg' | 'egg';
  category: string;
  image: string;
  isBestSeller: boolean;
  discountPrice: number | null;
  tag?: string;
}