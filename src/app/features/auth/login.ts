import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="login">
      <h1>Sign in</h1>
      <mat-form-field>
        <mat-label>Username</mat-label>
        <input matInput formControlName="username" autocomplete="username" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Password</mat-label>
        <input
          matInput
          type="password"
          formControlName="password"
          autocomplete="current-password"
        />
      </mat-form-field>
      @if (error()) {
        <p role="alert">{{ error() }}</p>
      }
      <button mat-flat-button type="submit" [disabled]="form.invalid || busy()">Sign in</button>
    </form>
  `,
  styles: `
    .login {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 320px;
      margin: 15vh auto;
    }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected submit() {
    const { username, password } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.auth.login(username, password).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.busy.set(false);
        this.error.set('Invalid username or password');
      },
    });
  }
}
