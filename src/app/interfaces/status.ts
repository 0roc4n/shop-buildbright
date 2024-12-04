export { Status, QuatationStatus}

enum Status {
  Declined    = -2,
  Canceled    = -1,
  InCart      =  0,
  Pending     =  1,
  Preparing   =  1.5,
  OrderReady  =  2,
  OnDelivery  =  2.5,
  Delivered   =  3,
  WithReview  =  4,
  Resolved    =  5,
  Offered     = 1.2
}

enum QuatationStatus{
  Declined,
  Pending,
  Accepted,
}