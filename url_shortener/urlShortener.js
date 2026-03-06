const StatusEnum = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});

class Url {
  constructor(id, shortCode, longUrl, expiryTime = null) {
    this.id = id;
    this.longUrl = longUrl;
    this.shortCode = shortCode;
    this.expiryTime = expiryTime;
    this.status = StatusEnum.ACTIVE;
    this.createdAt = Date.now();
  }

  isExpired() {
    return this.expiryTime !== null && this.expiryTime < Date.now();
  }

  deactivate() {
    this.status = StatusEnum.INACTIVE;
  }
}

class KeyGenerationStrategy {
  generate(num) {
    throw new Error("Must override generate()");
  }
}

class Base62Strategy extends KeyGenerationStrategy {
  constructor() {
    super();
    this.charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  }

  generate(num) {
    if (num === 0)
      return this.charset[0];
    let res = "";
    const size = this.charset.length;
    while (num) {
      res = this.charset[num % size] + res;
      num = Math.floor(num / size);
    }
    return res;
  }
}

class RandomStrategy extends KeyGenerationStrategy {
  constructor() {
    super();
    this.charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  }

  generate(num) {
    let res = "";
    for (let i = 0; i < 7; i++)
      res += this.charset[Math.floor(Math.random() * this.charset.length)];
    return res;
  }
}

class UrlRepository {
  static idCounter = 1;
  constructor() {
    this.longToShort = new Map();
    this.shortToUrl = new Map();
  }

  generateId() {
    return UrlRepository.idCounter++;
  }

  save(url) {
    this.longToShort.set(url.longUrl, url.shortCode);
    this.shortToUrl.set(url.shortCode, url);
  }

  findByShortCode(sc) {
    return this.shortToUrl.get(sc) || null;
  }

  findByLongUrl(lurl) {
    const shortCode = this.longToShort.get(lurl);
    if (!shortCode)
      return null;
    return this.findByShortCode(shortCode);
  }

  delete(shortCode) {
    const url = this.shortToUrl.get(shortCode);
    if (!url) return;
    this.shortToUrl.delete(shortCode);
    this.longToShort.delete(url.longUrl);
  }
}

class UrlShortenerService {
  constructor(repository, keyStrategy) {
    this.repository = repository;
    this.keyStrategy = keyStrategy;
  }

  shortenUrl(longUrl, expiryTime = null) {
    // Prevent duplicate short URLs for same long URL
    const existing = this.repository.findByLongUrl(longUrl);
    if (existing) {
      return existing.shortCode;
    }

    const id = this.repository.generateId();
    const shortCode = this.keyStrategy.generate(id);

    const url = new Url(id, shortCode, longUrl, expiryTime);
    this.repository.save(url);

    return shortCode;
  }

  redirect(shortCode) {
    const url = this.repository.findByShortCode(shortCode);

    if (!url) {
      return "404 - Not Found";
    }

    if (url.status !== StatusEnum.ACTIVE || url.isExpired()) {
      return "410 - Link Expired/Inactive";
    }
    return url.longUrl;
  }

  deactivate(shortCode) {
    const url = this.repository.findByShortCode(shortCode);
    if (url) {
      url.deactivate();
    }
  }
}

const repo = new UrlRepository();
const strategy = new Base62Strategy();
const service = new UrlShortenerService(repo, strategy);

const short = service.shortenUrl("https://google.com", Date.now() + 60000);

console.log("Short URL:", short);

console.log("Redirect:", service.redirect(short));
console.log("Redirect:", service.redirect(short));
