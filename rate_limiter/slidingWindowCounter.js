class RateLimiter {
  allowRequest(userId) {
    throw new Error("Must override allowRequest()");
  }
}

class SlidingWindowCounter extends RateLimiter {
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
        prevCount: 0,
        currentCount: 1,
        windowStart,
      });
      return true;
    }

    const entry = this.req.get(userId);
    if (windowStart > entry.windowStart) {
      if (windowStart === entry.windowStart + this.windowSize)
        entry.prevCount = entry.currentCount;
      else
        entry.prevCount = 0;
      entry.currentCount = 0;
      entry.windowStart = windowStart;
    }

    const elapsed = (now - entry.windowStart);
    const overlapRatio = (this.windowSize - elapsed) / this.windowSize;
    const effectiveCount = entry.prevCount * overlapRatio + entry.currentCount;

    if (effectiveCount >= this.capacity)
      return false;
    entry.currentCount++;
    return true;
  }
}

// ---------------- TEST ----------------

const limiter = new SlidingWindowCounter(5000, 3);
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