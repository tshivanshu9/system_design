class RateLimiter {
  allowRequest(userId) {
    throw new Error("Must override allowRequest()");
  }
}

class TokenBucket extends RateLimiter {
  constructor(refillRate, capacity) {
    super();
    this.refillRate = refillRate;
    this.capacity = capacity;
    this.req = new Map();
  }

  allowRequest(userId) {
    const now = Date.now();
    if (!this.req.has(userId)) {
      this.req.set(userId, {
        tokens: this.capacity - 1,
        lastRefillTs: now,
      });
      return true;
    }

    const entry = this.req.get(userId);
    const elapsed = (now - entry.lastRefillTs) / 1000;
    const newTokens = Math.min(this.capacity, entry.tokens + this.refillRate * elapsed);
    entry.tokens = newTokens;
    entry.lastRefillTs = now;

    if (entry.tokens < 1)
      return false;
    entry.tokens--;
    return true;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTokenBucketDemo() {
  console.log("=== TokenBucket Demo ===");

  // 2 tokens/sec refill, max bucket size 5
  const limiter = new TokenBucket(2, 5);
  const user = "user-1";

  console.log("\n1) Burst test (capacity = 5):");
  for (let i = 1; i <= 7; i++) {
    console.log(`request ${i}:`, limiter.allowRequest(user));
  }
  // Expected: first 5 true, then false, false (or similar depending on tiny timing differences)

  console.log("\n2) Refill test (wait ~1.2s, expect ~2 tokens refilled):");
  await sleep(1200);
  console.log("request after wait #1:", limiter.allowRequest(user)); // likely true
  console.log("request after wait #2:", limiter.allowRequest(user)); // likely true
  console.log("request after wait #3:", limiter.allowRequest(user)); // likely false

  console.log("\n3) Per-user isolation test:");
  const alice = "alice";
  const bob = "bob";
  console.log("alice #1:", limiter.allowRequest(alice)); // true
  console.log("bob   #1:", limiter.allowRequest(bob));   // true
  console.log("alice #2:", limiter.allowRequest(alice)); // true
  console.log("bob   #2:", limiter.allowRequest(bob));   // true
}

runTokenBucketDemo().catch((err) => console.error(err));