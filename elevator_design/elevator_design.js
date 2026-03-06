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
  constructor(floor, direction, peopleCount = 1) {
    this.floor = floor;
    this.direction = direction;
    this.peopleCount = peopleCount;
  }
}

class ElevatorCar {
  constructor(id, capacity = 10) {
    this.id = id;
    this.currentFloor = 0;
    this.direction = Direction.IDLE;
    this.state = ElevatorState.IDLE;
    this.upRequests = [];
    this.downRequests = [];
    this.currentLoad = 0;
    this.pendingLoad = 0;
    this.capacity = capacity;
  }

  addRequest(request) {
    if (this.pendingLoad + request.peopleCount > this.capacity) {
      console.log(`Elevator ${this.id} rejected request due to capacity`);
      return false;
    }
    this.pendingLoad += request.peopleCount;
    if (request.floor >= this.currentFloor) {
      this.upRequests.push(request);
      this.upRequests.sort((a, b) => a.floor - b.floor);
    } else {
      this.downRequests.push(request);
      this.downRequests.sort((a, b) => b.floor - a.floor);
    }
    return true;
  }

  step() {
    if ([Direction.UP, Direction.IDLE].includes(this.direction)) {
      if (this.upRequests.length > 0) {
        this.direction = Direction.UP;
        const nextReq = this.upRequests.shift();
        this.pendingLoad -= nextReq.peopleCount;
        this.currentLoad += nextReq.peopleCount;
        this.moveTo(nextReq.floor, nextReq.peopleCount);
        return;
      }
      if (this.downRequests.length > 0) {
        this.direction = Direction.DOWN;
        return;
      }
    } else {
      if (this.downRequests.length > 0) {
        const nextReq = this.downRequests.shift();
        this.pendingLoad -= nextReq.peopleCount;
        this.currentLoad += nextReq.peopleCount;
        this.moveTo(nextReq.floor, nextReq.peopleCount);
        return;
      }
      if (this.upRequests.length > 0)
        this.direction = Direction.UP;
    }
    this.direction = Direction.IDLE;
  }

  moveTo(floor, peopleCount) {
    this.state = ElevatorState.MOVING;
    console.log(`Elevator ${this.id} moving from ${this.currentFloor} → ${floor}`);
    this.currentFloor = floor;
    this.openDoor(peopleCount);
  }

  openDoor(peopleCount) {
    this.state = ElevatorState.STOPPED;
    this.currentLoad -= peopleCount;
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
    for (const elevator of elevators) {
      if (elevator.state === ElevatorState.IDLE)
        return elevator;
    }
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

  submitExternalRequest(floor, direction, peopleCount) {
    let chosenElevator = null;
    for (const strategy of this.strategies) {
      chosenElevator = strategy.selectElevator(floor, direction, this.elevators);
      if (chosenElevator)
        break;
    }
    if (chosenElevator) {
      console.log(`Dispatcher assigned Elevator ${chosenElevator.id}`);
      const accepted = chosenElevator.addRequest(new LiftRequest(floor, direction, peopleCount));
      if (!accepted)
        console.log("Dispatcher could not assign request due to capacity");
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

  requestElevator(floor, direction, peopleCount) {
    this.dispatcher.submitExternalRequest(floor, direction, peopleCount);
  }

  step() {
    for (const elevator of this.elevators)
      elevator.step();
  }
}

const system = new ElevatorSystem(2);

system.elevators[0].capacity = 5;

system.requestElevator(5, Direction.UP, 3); // accepted
system.requestElevator(6, Direction.UP, 3); // should be rejected (3+3 > 5)

system.requestElevator(2, Direction.DOWN, 2); // accepted

system.step();
system.step();
system.step();