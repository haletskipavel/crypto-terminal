import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  livePrice: number | null;
  change24h: number | null;
}

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
}

const SKIP_IDS = new Set([
  'tether', 'usd-coin', 'dai', 'first-digital-usd', 'usds',
  'ethena-usde', 'true-usd', 'wrapped-bitcoin', 'staked-ether',
  'wrapped-steth', 'wrapped-ether', 'binance-peg-weth',
]);

@Injectable({ providedIn: 'root' })
export class CryptoService implements OnDestroy {
  private http = inject(HttpClient);

  coins = signal<Coin[]>([]);
  connected = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  lastUpdated = signal<Date | null>(null);

  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private coinSymbols: string[] = [];

  loadTopCoins(): void {
    this.loading.set(true);
    this.error.set(null);

    const url =
      'https://api.coingecko.com/api/v3/coins/markets' +
      '?vs_currency=usd&order=market_cap_desc&per_page=25&page=1&sparkline=false';

    this.http.get<CoinGeckoMarket[]>(url).subscribe({
      next: (data) => {
        const coins = data
          .filter((c) => !SKIP_IDS.has(c.id))
          .slice(0, 5)
          .map((c) => ({
            id: c.id,
            symbol: c.symbol.toLowerCase(),
            name: c.name,
            image: c.image,
            current_price: c.current_price,
            market_cap: c.market_cap,
            market_cap_rank: c.market_cap_rank,
            price_change_percentage_24h: c.price_change_percentage_24h,
            livePrice: null,
            change24h: null,
          }));
        this.coins.set(coins);
        this.loading.set(false);
        this.coinSymbols = coins.map((c) => c.symbol);
        this.connectWebSocket();
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load coin data. Check your connection and try again.');
      },
    });
  }

  private connectWebSocket(): void {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }

    const streams = this.coinSymbols.map((s) => `${s}usdt@ticker`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => this.connected.set(true);

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string);
      const t = msg.data;
      if (!t?.s) return;

      const symbol = t.s.toLowerCase().replace('usdt', '');
      const price = parseFloat(t.c);
      const change = parseFloat(t.P);

      this.coins.update((list) =>
        list.map((coin) =>
          coin.symbol === symbol ? { ...coin, livePrice: price, change24h: change } : coin,
        ),
      );
      this.lastUpdated.set(new Date());
    };

    this.ws.onclose = () => {
      this.connected.set(false);
      this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 2000);
    };

    this.ws.onerror = () => this.ws?.close();
  }

  ngOnDestroy(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }
  }
}
