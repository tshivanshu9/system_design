class RateLimiter {
  allowRequest(userId) {
    throw new Error("Must override allowRequest()");
  }
}

class SlidingWindowLog extends RateLimiter {
  constructor(windowSize, capacity) {
    super();
    this.windowSize = windowSize;
    this.capacity = capacity;
    this.req = new Map();
  }

  allowRequest(userId) {
    const now = Date.now();
    if (!this.req.has(userId)) {
      this.req.set(userId, [now]);
      return true;
    }

    const entry = this.req.get(userId);
    while (entry.length > 0 && now - entry[0] > this.windowSize)
      entry.shift();
    if (entry.length >= this.capacity)
      return false;
    entry.push(now);
    return true;
  }
}

// ---------------- TEST ----------------

const limiter = new SlidingWindowLog(5000, 3);
// 3 requests per 5 seconds

const user = "user1";

function simulateRequest() {
  const allowed = limiter.allowRequest(user);
  console.log(
    new Date().toLocaleTimeString(),
    allowed ? "✅ Allowed" : "❌ Blocked"
  );
}

setInterval(simulateRequest, 1000);