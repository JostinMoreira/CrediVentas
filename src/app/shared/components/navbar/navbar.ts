import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent implements OnInit {
  readonly darkMode = signal(false);

  ngOnInit(): void {
    let enabled = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    try {
      const saved = localStorage.getItem('crediventas-theme');
      if (saved === 'dark' || saved === 'light') enabled = saved === 'dark';
    } catch { /* Use the system preference when browser storage is unavailable. */ }
    this.applyTheme(enabled);
  }

  toggleTheme(): void {
    this.applyTheme(!this.darkMode());
  }

  private applyTheme(enabled: boolean): void {
    this.darkMode.set(enabled);
    document.documentElement.dataset['theme'] = enabled ? 'dark' : 'light';
    document.documentElement.style.colorScheme = enabled ? 'dark' : 'light';
    try { localStorage.setItem('crediventas-theme', enabled ? 'dark' : 'light'); }
    catch { /* Theme remains active for this visit if storage is unavailable. */ }
  }
}
