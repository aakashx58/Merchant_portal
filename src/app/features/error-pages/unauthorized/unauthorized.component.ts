import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './unauthorized.component.html',
  styleUrl: './unauthorized.component.scss',
})
export class UnauthorizedComponent {
  private readonly router = inject(Router);

  protected goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  protected signOut() {
    this.router.navigate(['/login']);
  }
}