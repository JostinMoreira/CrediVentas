import { Component, inject } from '@angular/core';
import { ErrorReporter } from './core/services/error-reporter';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  readonly errors = inject(ErrorReporter);
}
