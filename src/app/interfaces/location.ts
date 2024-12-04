export {Address, Coordinates}

interface Address {
  completeAddress : String
  coordinates     : Coordinates
  deliveryArea    : String
  instructions    : String
  nickname        : String
}

interface Coordinates{
  lat:  number
  lng:  number
}
