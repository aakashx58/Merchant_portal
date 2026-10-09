import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { finalize, Observable } from 'rxjs';

@Component({
  selector: 'app-masked-field',
  imports: [MatButtonModule],
  templateUrl: './masked-field.component.html',
  styleUrl: './masked-field.component.scss',
})
export class MaskedFieldComponent {
  readonly label = input.required<string>();
  readonly masked = input.required<string>();
  readonly revealable = input(false);
  readonly reveal = input<() => Observable<string>>();
  readonly timeoutMs = input(15000);

  protected readonly value = signal<string | null>(null);
  protected readonly loading = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected show() {
    const reveal = this.reveal();
    if (!reveal || this.loading()) return;
    this.loading.set(true);
    reveal()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (value) => {
          this.value.set(value);
          clearTimeout(this.timer);
          this.timer = setTimeout(() => this.hide(), this.timeoutMs());
        },
        error: () => undefined,
      });
  }

  protected hide() {
    clearTimeout(this.timer);
    this.value.set(null);
  }
}
