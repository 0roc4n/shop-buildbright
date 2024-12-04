export {Payment}

interface Payment {
  deliveryFee   : number
  itemTotal     : number
  method        : string
  status        : number
  toPay         : number
  totalCharges  : number
  totalDiscount : number
}
