class RateLimiter {
  allowRequest(userId) {
    throw new Error("Must override allowRequest()");
  }
}

class LeakyBucket extends RateLimiter {
  constructor(leakRate, capacity) {
    super();
    this.leakRate = leakRate;
    this.capacity = capacity;
    this.req = new Map();
  }

  allowRequest(userId) {
    const now = Date.now();
    if (!this.req.has(userId)) {
      this.req.set(userId, {
        water: 1,
        lastTimestamp: now,
      });
      return true;
    }

    const entry = this.req.get(userId);
    const elapsed = (now - entry.lastTimestamp) / 1000;
    const effective = Math.max(0, entry.water - elapsed * this.leakRate);
    entry.water = effective;
    entry.lastTimestamp = now;

    if (entry.water >= this.capacity)
      return false;
    entry.water++;
    return true;
  }
}

// ------------------- TEST -------------------

const limiter = new LeakyBucket(1, 5);
// leakRate = 1 request/sec
// capacity = 5

const user = "user1";

function simulateRequest() {
  const allowed = limiter.allowRequest(user);

  console.log(
    new Date().toLocaleTimeString(),
    allowed ? "✅ Allowed" : "❌ Blocked"
  );
}

setInterval(simulateRequest, 500);