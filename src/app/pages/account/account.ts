import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account.html',
})
export class Account {
  name = 'Guest User';
  phone = '';
  address = '';
}