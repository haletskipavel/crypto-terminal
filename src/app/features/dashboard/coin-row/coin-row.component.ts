import { Component, input, signal, effect } from '@angular/core';
import { Coin } from '../../../core/crypto.service';

@Component({
  selector: '[app-coin-row]',
  standalone: true,
  imports: [],
  templateUrl: './coin-row.component.html',
  styleUrl: './coin-row.component.scss',
  host: { class: 'coin-row' },
})
export class CoinRowComponent {
  coin = input.required<Coin>();
  flash = signal<'up' | 'down' | null>(null);

  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    let prevPrice: number | null = null;

    effect(() => {
      const price = this.coin().livePrice;
      if (price !== null && prevPrice !== null && price !== prevPrice) {
        if (this.flashTimer) clearTimeout(this.flashTimer);
        this.flash.set(price > prevPrice ? 'up' : 'down');
        this.flashTimer = setTimeout(() => this.flash.set(null), 700);
      }
      prevPrice = price;
    });
  }

  displayPrice(): number {
    return this.coin().livePrice ?? this.coin().current_price;
  }

  displayChange(): number {
    return this.coin().change24h ?? this.coin().price_change_percentage_24h;
  }

  formatPrice(price: number): string {
    if (price >= 10000) {
      return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    }
    if (price >= 1) {
      return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (price >= 0.01) {
      return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4 });
    }
    return '$' + price.toFixed(6);
  }

  formatMarketCap(cap: number): string {
    if (cap >= 1e12) return `$${parseFloat((cap / 1e12).toFixed(1))}T`;
    if (cap >= 1e9) return `$${parseFloat((cap / 1e9).toFixed(1))}B`;
    if (cap >= 1e6) return `$${parseFloat((cap / 1e6).toFixed(1))}M`;
    return `$${cap.toLocaleString()}`;
  }
}
