import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type BowlType = 'sprouts' | 'egg' | 'paneer' | 'chicken';

interface BowlData {
  type: BowlType;
  title: string;
  description: string;
  calories: string;
  ingredients: string[];
  image: string;
  basePrice: number;
}

@Component({
  selector: 'app-rotating-bowl',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rotating-bowl.component.html',
  styleUrls: ['./rotating-bowl.component.css']
})
export class RotatingBowlComponent {
  // Current active bowl index
  activeIndex = signal(0);
  isAnimating = signal(false);

  // Bowl data for rotation
  bowls: BowlData[] = [
    {
      type: 'sprouts',
      title: 'Fresh Sprouts Power Bowl',
      description: 'Protein-packed moong sprouts with fresh vegetables',
      calories: '320 cal',
      ingredients: ['Moong Sprouts', 'Cucumber', 'Tomato', 'Bell Pepper', 'Onion', 'Lemon Dressing'],
      image: 'https://images.unsplash.com/photo-1540420828642-fca2c5c18abe',
      basePrice: 99
    },
    {
      type: 'egg',
      title: 'Egg Protein Bowl',
      description: 'Boiled eggs with quinoa and roasted vegetables',
      calories: '420 cal',
      ingredients: ['Boiled Eggs', 'Quinoa', 'Avocado', 'Spinach', 'Cherry Tomatoes', 'Herb Dressing'],
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
      basePrice: 129
    },
    {
      type: 'paneer',
      title: 'Air Fried Paneer Bowl',
      description: 'Crispy air-fried paneer with sweet corn mix',
      calories: '380 cal',
      ingredients: ['Air Fried Paneer', 'Sweet Corn', 'Capsicum', 'Onion', 'Mexican Seasoning', 'Yogurt Dip'],
      image: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05',
      basePrice: 149
    },
    {
      type: 'chicken',
      title: 'Chicken Protein Bowl',
      description: 'Grilled chicken breast with roasted vegetables',
      calories: '450 cal',
      ingredients: ['Grilled Chicken', 'Broccoli', 'Bell Pepper', 'Sweet Potato', 'Brown Rice', 'Herb Sauce'],
      image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143',
      basePrice: 169
    }
  ];

  get activeBowl(): BowlData {
    return this.bowls[this.activeIndex()];
  }

  // Navigate to next bowl
  nextBowl(): void {
    if (this.isAnimating()) return;
    
    this.isAnimating.set(true);
    this.activeIndex.update(current => (current + 1) % this.bowls.length);
    
    setTimeout(() => this.isAnimating.set(false), 500);
  }

  // Navigate to previous bowl
  prevBowl(): void {
    if (this.isAnimating()) return;
    
    this.isAnimating.set(true);
    this.activeIndex.update(current => 
      current === 0 ? this.bowls.length - 1 : current - 1
    );
    
    setTimeout(() => this.isAnimating.set(false), 500);
  }

  // Go to specific bowl
  goToBowl(index: number): void {
    if (this.isAnimating() || index === this.activeIndex()) return;
    
    this.isAnimating.set(true);
    this.activeIndex.set(index);
    setTimeout(() => this.isAnimating.set(false), 500);
  }

  getIngredientPosition(index: number): any {
  const angle = (index * 360 / this.activeBowl.ingredients.length) * (Math.PI / 180);
  const radius = 120; // Distance from center
  
  return {
    left: `calc(50% + ${Math.cos(angle) * radius}px)`,
    top: `calc(50% + ${Math.sin(angle) * radius}px)`,
    transform: 'translate(-50%, -50%)',
    'animation-delay': `${index * 0.1}s`
  };
}
}