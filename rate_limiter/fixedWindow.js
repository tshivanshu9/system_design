class RateLimiter {
  allowRequest(userId) {
    throw new Error("Must override allowRequest()");
  }
}

class FixedWindow extends RateLimiter {
  constructor(windowSize, capacity) {
    super();
    this.windowSize = windowSize;
    this.capacity = capacity;
    this.req = new Map();
  }

  allowRequest(userId) {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowSize) * this.windowSize;
    if (!this.req.has(userId)) {
      this.req.set(userId, {
        count: 1,
        windowStart,
      });
      return true;
    }

    const entry = this.req.get(userId);
    if (windowStart > entry.windowStart) {
      entry.count = 0;
      entry.windowStart = windowStart;
    }

    if (entry.count >= this.capacity)
      return false;
    entry.count++;
    return true;
  }
}

// ------------------- TEST -------------------

const limiter = new FixedWindow(5000, 3);
// window = 5 sec, capacity = 3 requests

const user = "user1";

function simulateRequest() {
  const allowed = limiter.allowRequest(user);
  console.log(
    new Date().toLocaleTimeString(),
    "Request:",
    allowed ? "✅ Allowed" : "❌ Blocked"
  );
}

// simulate request every second
setInterval(simulateRequest, 1000);