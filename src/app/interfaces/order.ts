import { Address } from './location'
import { Payment } from './payment'
export {Cart, Order , OrderItem}


interface Cart {
  clientId        : String
  items           : Array<OrderItem>
  status          : number
  storeId         : String
  timestamp       : number
}

interface Order extends Cart{
  deliveryAddress: Address,
  paymentData: Payment
}


interface OrderItem{
  name         : String
  productId    : String
  qty          : number
  totalPrice   : number
  unitPrice    : number
}


