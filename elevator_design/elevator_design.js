const Direction = Object.freeze({
  UP: "UP",
  DOWN: "DOWN",
  IDLE: "IDLE",
});

const ElevatorState = Object.freeze({
  MOVING: "MOVING",
  STOPPED: "STOPPED",
  IDLE: "IDLE",
  OUT_OF_SERVICE: "OUT_OF_SERVICE",
});

class LiftRequest {
  constructor(floor, direction) {
    this.floor = floor;
    this.direction = direction;
  }
}

class ElevatorCar {
  constructor(id) {
    this.id = id;
    this.currentFloor = 0;
    this.direction = Direction.IDLE;
    this.state = ElevatorState.IDLE;
    this.upRequests = [];
    this.downRequests = [];
  }

  addRequest(request) {
    if (request.floor >= this.currentFloor) {
      this.upRequests.push(request.floor);
      this.upRequests.sort((a, b) => a - b);
    } else {
      this.downRequests.push(request.floor);
      this.downRequests.sort((a, b) => b - a);
    }
  }

  step() {
    if ([Direction.UP, Direction.IDLE].includes(this.direction)) {
      if (this.upRequests.length > 0) {
        this.direction = Direction.UP;
        const nextFloor = this.upRequests.shift();
        this.moveTo(nextFloor);
        return;
      }
      if (this.downRequests.length > 0) {
        this.direction = Direction.DOWN;
        return;
      }
    } else {
      if (this.downRequests.length > 0) {
        const nextFloor = this.downRequests.shift();
        this.moveTo(nextFloor);
        return;
      }
      if (this.upRequests.length > 0)
        this.direction = Direction.UP;
    }
    this.direction = Direction.IDLE;
  }

  moveTo(floor) {
    this.state = ElevatorState.MOVING;
    console.log(`Elevator ${this.id} moving from ${this.currentFloor} → ${floor}`);
    this.currentFloor = floor;
    this.openDoor();
  }

  openDoor() {
    this.state = ElevatorState.STOPPED;
    console.log(`Elevator ${this.id} door opened at floor ${this.currentFloor}`);
  }
}

class DispatchStrategy {
  selectElevator(requestFloor, direction, elevators) {
    throw new Error("Must override selectElevator()");
  }
}

class MovingTowardsStrategy extends DispatchStrategy {
  selectElevator(requestFloor, direction, elevators) {
    for (const elevator of elevators) {
      if (elevator.state === ElevatorState.OUT_OF_SERVICE)
        continue;
      if ((direction === elevator.direction) && ((direction === Direction.UP && requestFloor >= elevator.currentFloor) ||
        (direction === Direction.DOWN && requestFloor <= elevator.currentFloor)))
        return elevator;
    }
    return null;
  }
}

class IdleElevatorStrategy extends DispatchStrategy {
  selectElevator(requestFloor, direction, elevators) {
    elevators.forEach(elevator => {
      if (elevator.state === ElevatorState.IDLE)
        return elevator;
    });
    return null;
  }
}

class ClosestElevatorStrategy extends DispatchStrategy {
  selectElevator(requestFloor, direction, elevators) {
    let bestElevator = null, minDistance = Infinity;
    elevators.forEach(elevator => {
      const distance = Math.abs(requestFloor - elevator.currentFloor);
      if (distance < minDistance) {
        minDistance = distance;
        bestElevator = elevator;
      }
    });
    return bestElevator;
  }
}

class Dispatcher {
  constructor(elevators) {
    this.elevators = elevators;
    this.strategies = [
      new MovingTowardsStrategy(),
      new IdleElevatorStrategy(),
      new ClosestElevatorStrategy(),
    ];
  }

  submitExternalRequest(floor, direction) {
    let chosenElevator = null;
    for (const strategy of this.strategies) {
      chosenElevator = strategy.selectElevator(floor, direction, this.elevators);
      if (chosenElevator)
        break;
    }
    if (chosenElevator) {
      console.log(`Dispatcher assigned Elevator ${chosenElevator.id}`);
      chosenElevator.addRequest(new LiftRequest(floor, direction));
    }
  }
}

class ElevatorSystem {
  constructor(numElevators) {
    this.elevators = [];
    for (let i = 0; i < numElevators; i++)
      this.elevators.push(new ElevatorCar(i));

    this.dispatcher = new Dispatcher(this.elevators);
  }

  requestElevator(floor, direction) {
    this.dispatcher.submitExternalRequest(floor, direction);
  }

  step() {
    for (const elevator of this.elevators)
      elevator.step();
  }
}

const system = new ElevatorSystem(2);

system.requestElevator(5, Direction.UP);
system.requestElevator(2, Direction.DOWN);

system.step();
system.step();
system.step();