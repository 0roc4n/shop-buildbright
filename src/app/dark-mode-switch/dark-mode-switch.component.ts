import { Component, OnInit } from '@angular/core';
import { DarkModeService } from '../dark-mode.service';

@Component({
  selector: 'app-dark-mode-switch',
  templateUrl: './dark-mode-switch.component.html',
  styleUrls: ['./dark-mode-switch.component.scss'],
})
export class DarkModeSwitchComponent implements OnInit {
  darkModeState = false;
  label = 'Dark Mode';

  constructor(private darkModeService: DarkModeService) {}

  ngOnInit() {
    this.darkModeService.darkModeState$.subscribe((state) => {
      this.darkModeState = state;
    });
  }

  toggleDarkMode() {
    this.darkModeService.toggleDarkMode();
  }
}
