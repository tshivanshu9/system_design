const TaskStatus = Object.freeze({
  SCHEDULED: "SCHEDULED",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
});

class Task {
  constructor(id, executeFn, runAt, maxRetries = 2) {
    this.id = id;
    this.executeFn = executeFn;
    this.runAt = runAt;
    this.maxRetries = maxRetries;
    this.retryCount = 0;
    this.status = TaskStatus.SCHEDULED;
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

  remove(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
  }
}

class Worker {
  constructor(id) {
    this.id = id;
    this.busy = false;
  }

  async execute(task) {
    this.busy = true;
    task.status = TaskStatus.RUNNING;
    console.log(`Worker ${this.id} executing task ${task.id}`);
    try {
      await task.run();
      console.log(`Task ${task.id} completed`);
      task.status = TaskStatus.COMPLETED;
    } catch (error) {
      console.log(`Task ${task.id} failed`);
      task.status = TaskStatus.FAILED;
      throw error;
    } finally {
      this.busy = false;
    }
  }
}

class TaskScheduler {
  constructor(workerCount = 2) {
    this.workers = [];
    this.queue = new TaskQueue();
    this.timer = null;
    this.taskMap = new Map();
    for (let i = 0; i < workerCount; i++)
      this.workers.push(new Worker(i));
  }

  schedule(task) {
    console.log(`Scheduling task ${task.id}`);
    this.queue.add(task);
    this.taskMap.set(task.id, task);
    this.scheduleNext();
  }

  cancel(taskId) {
    if (!this.taskMap.has(taskId))
      return false;
    console.log(`Cancelling task ${taskId}`);
    const task = this.taskMap.get(taskId);
    task.status = TaskStatus.CANCELLED;
    this.taskMap.delete(taskId);
    this.queue.remove(taskId);
    this.scheduleNext();
    return true;
  }

  getFreeWorker() {
    return this.workers.find(w => !w.busy);
  }

  scheduleNext() {
    if (this.timer)
      clearTimeout(this.timer);
    const nextTask = this.queue.peek();
    if (!nextTask)
      return;
    const delay = Math.max(0, nextTask.runAt - Date.now());
    this.timer = setTimeout(() => {
      this.executeNext();
    }, delay);
  }

  async executeNext() {
    const task = this.queue.poll();
    if (!task)
      return;
    if (task.status === TaskStatus.CANCELLED) {
      this.scheduleNext();
      return;
    }
    const worker = this.getFreeWorker();
    if (!worker) {
      console.log("No free worker available, retrying...");
      this.queue.add(task);
      this.scheduleNext();
      return;
    }
    try {
      await worker.execute(task);
      this.taskMap.delete(task.id);
    } catch (error) {
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.runAt = Date.now() + 2000;
        console.log(`Retrying task ${task.id} (attempt ${task.retryCount})`);
        this.queue.add(task);
      } else {
        console.log(`Task ${task.id} permanently failed`);
        this.taskMap.delete(task.id);
      }
    }
    this.scheduleNext();
  }
}

const scheduler = new TaskScheduler(3);

const task1 = new Task(
  1,
  () => console.log("Send Email"),
  Date.now() + 2000
);

const task2 = new Task(
  2,
  () => console.log("Generate Report"),
  Date.now() + 4000
);

const task3 = new Task(
  3,
  () => {
    console.log("Flaky Job");
    throw new Error("Random failure");
  },
  Date.now() + 3000
);

scheduler.schedule(task1);
scheduler.schedule(task2);
scheduler.schedule(task3);

setTimeout(() => {
  scheduler.cancel(2);
}, 1000);