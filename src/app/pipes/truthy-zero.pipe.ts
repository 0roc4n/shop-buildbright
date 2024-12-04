import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truthyZero'
})
export class TruthyZeroPipe implements PipeTransform {

  transform(value: any): boolean {
    return value === 0 || !!value;
  }

}
