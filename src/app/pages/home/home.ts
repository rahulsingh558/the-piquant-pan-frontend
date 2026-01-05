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
import { CartService } from '../../services/cart';
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
export class YourPageComponent {}



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
      role: 'Fitness Trainer',
      text: 'As a fitness trainer, I recommend Meal to Heal to all my clients. The protein bowls are perfectly balanced and help in muscle recovery.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face'
    },
    {
      name: 'Rohan Mehta',
      role: 'IT Professional',
      text: 'Working long hours made healthy eating tough. Now with Meal to Heal, I get nutritious meals delivered. Lost 5kg in 2 months!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'
    },
    {
      name: 'Ananya Reddy',
      role: 'Nutritionist',
      text: 'The quality of ingredients and nutritional balance is impressive. My patients love the variety and taste while staying healthy.',
      rating: 4,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face'
    }
  ];

  /* =========================
     HEALTH BENEFITS
  ========================== */
  healthBenefits = [
    {
      icon: '🥬',
      title: 'Fresh Ingredients',
      description: 'Locally sourced, chemical-free vegetables delivered daily'
    },
    {
      icon: '⚖️',
      title: 'Balanced Nutrition',
      description: '30% protein, 40% carbs, 30% healthy fats in every meal'
    },
    {
      icon: '⚡',
      title: 'Quick Delivery',
      description: 'Within 30 minutes in Bangalore, hot and fresh'
    },
    {
      icon: '💚',
      title: 'Customizable',
      description: 'Choose your base, protein, and add-ons as per your diet'
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
    this.cartService.addToCart({
      foodId: food.foodId,
      name: food.name,
      basePrice: food.basePrice,
      addons: [],
      quantity: 1,
      totalPrice: food.basePrice,
    });
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