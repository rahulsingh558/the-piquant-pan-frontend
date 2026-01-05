import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
})
export class Contact {
  name = '';
  email = '';
  message = '';

  submit() {
    if (!this.name || !this.email || !this.message) {
      alert('Please fill all fields');
      return;
    }

    // For now just simulate submit
    alert('Thanks for contacting us! 💚');
    this.name = '';
    this.email = '';
    this.message = '';
  }
}