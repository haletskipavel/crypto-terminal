import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CryptoService } from '../../core/crypto.service';
import { ThemeService } from '../../core/theme.service';
import { CoinRowComponent } from './coin-row/coin-row.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CoinRowComponent, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  crypto = inject(CryptoService);
  themeService = inject(ThemeService);

  ngOnInit(): void {
    this.crypto.loadTopCoins();
  }
}
