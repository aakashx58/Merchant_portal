import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-server-error',
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './server-error.component.html',
  styleUrl: '../not-found/not-found.component.scss',
})
export class ServerErrorComponent {
  private readonly router = inject(Router);

  protected goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
