class Task {
  constructor(id, executeFn, runAt, retryCount = 0) {
    this.id = id;
    this.executeFn = executeFn;
    this.runAt = runAt;
    this.retryCount = retryCount;
  }

  async run() {
    await this.executeFn();
  }
}

class TaskQueue {
  constructor() {
    this.tasks = [];
  }

  add(task) {
    this.tasks.push(task);
    this.tasks.sort((a, b) => a.runAt - b.runAt);
  }

  peek() {
    return this.tasks[0];
  }

  poll() {
    return this.tasks.shift();
  }
}

class Worker {
  async execute(task) {
    try {
      console.log(`Running task ${task.id}`);
      await task.run();
      console.log(`Completed task ${task.id}`);
    } catch (error) {
      console.log(`Failed running task ${task.id}`);
      throw error;
    }
  }
}

class TaskScheduler {
  constructor(workersCount = 2) {
    this.queue = new TaskQueue();
    this.workers = [];
    for (let i = 0; i < workersCount; i++)
      this.workers.push(new Worker());
    this.start();
  }

  schedule(task) {
    console.log(`Scheduling task ${task.id}`);
    this.queue.add(task);
  }

  start() {
    setInterval(async () => {
      const now = Date.now();
      const nextTask = this.queue.peek();
      if (!nextTask)
        return;
      if (nextTask.runAt <= now) {
        const task = this.queue.poll();
        const worker = this.workers[Math.floor(Math.random() * this.workers.length)];
        try {
          await worker.execute(task);
        } catch (error) {
          console.log(`Failed executing task ${task.id}`);
          task.retryCount++;
          task.runAt = now + 2000;
          this.queue.add(task);
        }
      }
    }, 500);
  }
}

const scheduler = new TaskScheduler();

const task1 = new Task(
  1,
  () => console.log("Email sent"),
  Date.now() + 2000
);

const task2 = new Task(
  2,
  () => console.log("Report generated"),
  Date.now() + 4000
);

scheduler.schedule(task1);
scheduler.schedule(task2);