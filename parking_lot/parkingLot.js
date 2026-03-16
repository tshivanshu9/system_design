const SpotType = {
  SMALL: "SMALL",
  MEDIUM: "MEDIUM",
  LARGE: "LARGE",
};

const VehicleType = {
  BIKE: "BIKE",
  CAR: "CAR",
  TRUCK: "TRUCK",
};

class Vehicle {
  static idCounter = 0;
  constructor(type) {
    this.id = Vehicle.idCounter++;
    this.type = type;
  }

  getVehicleType() {
    return this.type;
  }

  getVehicleId() {
    return this.id;
  }

  canFitIn(spotType) {
    throw new Error("Must implement canFitIn()");
  }
}

class Bike extends Vehicle {
  constructor() {
    super(VehicleType.BIKE);
  }

  canFitIn(spotType) {
    return true;
  }
}

class Car extends Vehicle {
  constructor() {
    super(VehicleType.CAR)
  }

  canFitIn(spotType) {
    return spotType !== SpotType.SMALL;
  }
}

class Truck extends Vehicle {
  constructor() {
    super(VehicleType.TRUCK);
  }

  canFitIn(spotType) {
    return spotType === SpotType.LARGE;
  }
}

class ParkingSpot {
  static idCounter = 0;
  constructor(type) {
    this.id = ParkingSpot.idCounter++;
    this.type = type;
    this.vehicle = null;
  }

  getSpotType() {
    return this.type;
  }

  getId() {
    return this.id;
  }

  isEmpty() {
    return this.vehicle === null;
  }

  canPark(vehicle) {
    return this.isEmpty() && vehicle.canFitIn(this.type);
  }

  parkVehicle(v) {
    if (this.canPark(v))
      this.vehicle = v;
  }

  removeVehicle() {
    this.vehicle = null;
  }
}

class ParkingFloor {
  static idCounter = 0;
  constructor(maxSize) {
    this.id = ParkingFloor.idCounter++;
    this.maxSize = maxSize;
    this.spots = [];
  }

  addSpot(type) {
    if (this.spots.length === this.maxSize)
      return false;
    this.spots.push(new ParkingSpot(type));
    return true;
  }

  getFirstFreeSpot(vehicle) {
    for (const spot of this.spots) {
      if (spot.canPark(vehicle))
        return spot;
    }
    return null;
  }

  removeSpot(ps) {
    this.spots = this.spots.filter(s => s.getId() !== ps.getId());
  }
}

class Ticket {
  static idCounter = 0;
  constructor(vehicleId) {
    this.id = Ticket.idCounter++;
    this.spotId = null;
    this.vehicleId = vehicleId;
    this.entryTime = Date.now();
  }

  getEntryTime() {
    return this.entryTime;
  }

  getTicketId() {
    return this.id;
  }

  setSpotId(id) {
    this.spotId = id;
  }

  getVehicleId() {
    return this.vehicleId;
  }

  getSpotId() {
    return this.spotId;
  }
}

class DefaultPricingStrategy {
  getPrice(type, hours) {
    let basePrice;
    switch (type) {
      case SpotType.SMALL:
        basePrice = 10;
        break;
      case SpotType.MEDIUM:
        basePrice = 20;
        break;
      case SpotType.LARGE:
        basePrice = 40;
        break;
      default:
        basePrice = 10;
    }
    return basePrice * hours;
  }
}

class PricingStrategyManager {
  static instance = null;
  constructor() {
    this.defaultPricingStrategy = new DefaultPricingStrategy();
  }

  static getInstance() {
    if (!PricingStrategyManager.instance)
      PricingStrategyManager.instance = new PricingStrategyManager();
    return PricingStrategyManager.instance;
  }

  getTicketPrice(type, hours) {
    return this.defaultPricingStrategy.getPrice(type, hours);
  }
}

class ParkingLot {
  constructor(maxFloors) {
    this.maxFloors = maxFloors;
    this.floors = [];
    this.ticketToSpot = new Map();
    this.tickets = [];
  }

  addFloor(maxSize) {
    if (this.floors.length === this.maxFloors)
      return false;
    this.floors.push(new ParkingFloor(maxSize));
    return true;
  }

  getFloor(i) {
    if (i<0 || i>=this.floors.length)
      return null;
    return this.floors[i];
  }

  bookTicket(vehicle) {
    for (const floor of this.floors) {
      const spot = floor.getFirstFreeSpot(vehicle);
      if (!spot)
        continue;
      const ticket = new Ticket(vehicle.getVehicleId());
      ticket.setSpotId(spot.getId());
      this.tickets.push(ticket);
      this.ticketToSpot.set(ticket.getTicketId(), spot);
      spot.parkVehicle(vehicle);
      return true;
    }
    return false;
  }

  exitFromParking(ticketId) {
    const ticket = this.tickets.find(t => t.getTicketId() === ticketId);
    if (!ticket)
      return 0;
    const spot = this.ticketToSpot.get(ticketId);
    const hours = Math.ceil((Date.now() - ticket.getEntryTime()) / 3600000);
    const price = PricingStrategyManager.getInstance().getTicketPrice(spot.getSpotType(), hours);
    this.tickets = this.tickets.filter(t => t.getTicketId() !== ticketId);
    this.ticketToSpot.delete(ticketId);
    spot.removeVehicle();
    return price;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const parkingLot = new ParkingLot(2);

  parkingLot.addFloor(5);
  parkingLot.addFloor(5);

  parkingLot.getFloor(0).addSpot(SpotType.SMALL);
  parkingLot.getFloor(0).addSpot(SpotType.MEDIUM);
  parkingLot.getFloor(0).addSpot(SpotType.LARGE);

  parkingLot.getFloor(1).addSpot(SpotType.MEDIUM);
  parkingLot.getFloor(1).addSpot(SpotType.LARGE);

  const bike = new Bike();
  const car = new Car();
  const truck = new Truck();

  parkingLot.bookTicket(bike);
  parkingLot.bookTicket(car);
  parkingLot.bookTicket(truck);

  console.log("Vehicles parked successfully");

  await sleep(3000);

  console.log("Bike price:", parkingLot.exitFromParking(0));
  console.log("Car price:", parkingLot.exitFromParking(1));
  console.log("Truck price:", parkingLot.exitFromParking(2));
}

main();