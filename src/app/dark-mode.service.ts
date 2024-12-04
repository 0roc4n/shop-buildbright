import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DarkModeService {
  private STORAGE_KEY = 'darkModeState';
  private _darkModeState = new BehaviorSubject<boolean>(this.loadDarkModeStateFromStorage());
  darkModeState$ = this._darkModeState.asObservable();

  toggleDarkMode() {
    const current = this._darkModeState.value;
    this._darkModeState.next(!current);
    this.saveDarkModeStateToStorage(!current);
  }

  private loadDarkModeStateFromStorage(): boolean {
    const storedValue = localStorage.getItem(this.STORAGE_KEY);
    return storedValue ? JSON.parse(storedValue) : false;
  }

  private saveDarkModeStateToStorage(value: boolean): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(value));
  }
}
