import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UiButtonComponent } from '../../ui/ui-button/ui-button';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, UiButtonComponent],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent { }
