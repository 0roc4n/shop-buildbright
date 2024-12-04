import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { url } from 'inspector';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BootGuard implements CanActivate {
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if(state.url == '/login/boot' || state.url == '/boot'){
      if(sessionStorage.getItem('booted')){
        return false;
      }else{
        return true;
      }
    }
    if(sessionStorage.getItem('booted'))
      return true;
    if(state.url == '/login'){
      this.router.navigate(['login/boot']);
    }else{
      this.router.navigate(['/boot']);
    }
    return false;
  }
  constructor(private router:Router){}
}
