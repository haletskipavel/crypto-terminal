import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark'
  );

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('theme', t);
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }
}
