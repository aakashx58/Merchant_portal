import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly showPassword = signal(false);

  protected togglePassword() {
    this.showPassword.update(v => !v);
  }

  protected submit() {
    const { username, password } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.auth.login(username, password).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl()),
      error: () => {
        this.busy.set(false);
        this.error.set('Invalid username or password');
      },
    });
  }

  private returnUrl() {
    const url = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
    return url.startsWith('/') && !url.startsWith('//') ? url : '/';
  }
}
