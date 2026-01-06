import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { ProductsCarouselComponent } from '../../components/products-carousel/products-carousel.component';
import { ChatWidgetComponent } from '../../components/chat/chat.component';

@Component({
  standalone: true,
  imports: [ChatWidgetComponent],
  template: `
    <!-- Your existing page content -->
    <app-chat-widget></app-chat-widget>
  `
})
export class YourPageComponent { }



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



@Component({
  standalone: true,
  templateUrl: './home.html',
  imports: [
    RouterLink,
    CommonModule,
    ProductsCarouselComponent  // Add this
  ],
})


export class Home implements AfterViewInit {

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
     CAROUSEL STATE
  ========================== */
  activeTestimonialIndex = signal(0);

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

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private cartService: CartService
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

  getIngredientPosition(index: number): any {
    const total = this.activeBowl.ingredients.length;
    const angle = (index * 360 / total) * (Math.PI / 180);
    const radius = 120;

    return {
      left: `calc(50% + ${Math.cos(angle) * radius}px)`,
      top: `calc(50% + ${Math.sin(angle) * radius}px)`,
      transform: 'translate(-50%, -50%)',
      'animation-delay': `${index * 0.1}s`
    };
  }

  // Helper function for title case (replaces the pipe)
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
    foodId: number;
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

    // Subscribe if it's an observable (logged-in user)
    if (result && typeof result.subscribe === 'function') {
      result.subscribe({
        next: () => console.log('Item added to cart'),
        error: (err: any) => console.error('Error adding to cart:', err)
      });
    }
  }

  /* =========================
     WISHLIST (FIXED)
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
      const elements =
        document.querySelectorAll('.animate-on-scroll');

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
}