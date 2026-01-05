import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/* =========================
   ADDON MODEL
========================= */
export interface Addon {
  id: number;
  name: string;
  price: number;
}

/* =========================
   MENU ITEM MODEL (ADMIN = SOURCE OF TRUTH)
========================= */
export interface AdminMenuItem {
  id: number;
  name: string;
  subtitle: string;  
  basePrice: number;
  type: 'veg' | 'egg' | 'nonveg';
  image: string;

  // Ingredients (pre-selected)
  defaultAddons: Addon[];

  // Optional paid addons
  extraAddons: Addon[];
}

@Injectable({
  providedIn: 'root',
})
export class MenuAdminService {
  private readonly STORAGE_KEY = 'admin_menu_items';
  private isBrowser = false;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /* =========================
     READ
  ========================== */
  getAll(): AdminMenuItem[] {
    if (!this.isBrowser) return [];
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  getById(id: number): AdminMenuItem | undefined {
    return this.getAll().find(item => item.id === id);
  }

  /* =========================
     WRITE
  ========================== */
  private save(items: AdminMenuItem[]): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }

  /* =========================
     CREATE
  ========================== */
  add(item: Omit<AdminMenuItem, 'id'>): void {
    const items = this.getAll();

    const newItem: AdminMenuItem = {
      ...item,
      id: Date.now(),
    };

    items.push(newItem);
    this.save(items);
  }

  /* =========================
     UPDATE
  ========================== */
  update(updatedItem: AdminMenuItem): void {
    const items = this.getAll().map(item =>
      item.id === updatedItem.id ? updatedItem : item
    );
    this.save(items);
  }

  /* =========================
     DELETE
  ========================== */
  delete(id: number): void {
    const items = this.getAll().filter(item => item.id !== id);
    this.save(items);
  }

  /* =========================
     SEED (ONE TIME SYNC)
     Used to copy menu.ts items into admin
  ========================== */
  seedIfEmpty(items: AdminMenuItem[]): void {
    if (!this.isBrowser) return;
    if (this.getAll().length > 0) return;
    this.save(items);
  }

  /* =========================
     UTIL
  ========================== */
  clearAll(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.STORAGE_KEY);
  }
}