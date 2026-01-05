import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  tags: string[];
}

@Component({
  selector: 'app-products-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './products-carousel.component.html',
  styleUrls: ['./products-carousel.component.css']
})
export class ProductsCarouselComponent {
  // Current active slide index
  activeSlideIndex = signal(0);
  
  // Auto slide interval
  private autoSlideInterval: any;

  // Product data
  products: Product[] = [
    {
      id: 1,
      name: 'Classic Sprouts Bowl',
      description: 'Fresh moong sprouts with seasonal vegetables and lemon dressing',
      price: 99,
      category: 'Vegetarian',
      image: 'https://images.unsplash.com/photo-1540420828642-fca2c5c18abe?w=600&h=400&fit=crop&crop=center',
      rating: 4.8,
      tags: ['High Protein', 'Gluten Free', 'Vegan']
    },
    {
      id: 2,
      name: 'Corn Paneer Mix',
      description: 'Sweet corn with air-fried paneer cubes and Mexican seasoning',
      price: 149,
      category: 'Vegetarian',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop&crop=center',
      rating: 4.7,
      tags: ['High Protein', 'Air Fried', 'Rich in Calcium']
    },
    {
      id: 3,
      name: 'Chicken Protein Power',
      description: 'Grilled chicken breast with quinoa and roasted vegetables',
      price: 169,
      category: 'Non-Veg',
      image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&h=400&fit=crop&crop=center',
      rating: 4.9,
      tags: ['High Protein', 'Low Carb', 'Keto Friendly']
    },
    {
      id: 4,
      name: 'Egg & Avocado Bowl',
      description: 'Boiled eggs with avocado, cherry tomatoes, and whole grains',
      price: 129,
      category: 'Eggitarian',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop&crop=center',
      rating: 4.6,
      tags: ['High Protein', 'Rich in Omega-3', 'Balanced Meal']
    },
    {
      id: 5,
      name: 'Vegan Protein Bowl',
      description: 'Plant-based protein with tofu, edamame, and brown rice',
      price: 139,
      category: 'Vegan',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop&crop=center',
      rating: 4.5,
      tags: ['100% Plant Based', 'High Fiber', 'Cholesterol Free']
    },
    {
      id: 6,
      name: 'Air Fried Paneer Special',
      description: 'Crispy air-fried paneer with bell peppers and special sauce',
      price: 159,
      category: 'Vegetarian',
      image: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=600&h=400&fit=crop&crop=center',
      rating: 4.8,
      tags: ['Air Fried', 'Low Oil', 'Rich in Protein']
    }
  ];

  // Get visible products based on current slide
  getVisibleProducts(): Product[] {
    const start = this.activeSlideIndex() * 3;
    return this.products.slice(start, start + 3);
  }

  // Navigation methods
  nextSlide(): void {
    this.activeSlideIndex.update(current => {
      const maxIndex = Math.ceil(this.products.length / 3) - 1;
      return current === maxIndex ? 0 : current + 1;
    });
  }

  prevSlide(): void {
    this.activeSlideIndex.update(current => {
      const maxIndex = Math.ceil(this.products.length / 3) - 1;
      return current === 0 ? maxIndex : current - 1;
    });
  }

  goToSlide(index: number): void {
    const maxIndex = Math.ceil(this.products.length / 3) - 1;
    if (index >= 0 && index <= maxIndex) {
      this.activeSlideIndex.set(index);
    }
  }

  // Get category color
  getCategoryColor(category: string): string {
    switch (category.toLowerCase()) {
      case 'vegetarian': return 'bg-green-100 text-green-800';
      case 'vegan': return 'bg-emerald-100 text-emerald-800';
      case 'eggitarian': return 'bg-yellow-100 text-yellow-800';
      case 'non-veg': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Get total slides
  get totalSlides(): number {
    return Math.ceil(this.products.length / 3);
  }

  // Auto slide on component initialization
  ngOnInit(): void {
    this.startAutoSlide();
  }

  // Start auto sliding
  startAutoSlide(): void {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 4000); // Change slide every 4 seconds
  }

  // Stop auto sliding
  stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  // Clean up on destroy
  ngOnDestroy(): void {
    this.stopAutoSlide();
  }
}