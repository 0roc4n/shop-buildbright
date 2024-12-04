import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor() { }

  objToArrWithId(arr:Object){
    return arr
              ? Object.entries(arr).map((item)=> {
                  item[1].id = item[0]
                  return item[1]
                })
              : []
  }

  objToArr(){
    return
  }
}
