class Node {
  constructor(key, value, hash) {
    this.key = key;
    this.value = value;
    this.hash = hash;
  }
}

class MyHashMap {
  constructor(initialCapacity = 16, loadFactor = 0.75) {
    this.capacity = this._getPowerOfTwo(initialCapacity);
    this.loadFactor = loadFactor;
    this.buckets = new Array(this.capacity).fill(null);
    this.size = 0;
  }

  _getPowerOfTwo(num) {
    let power = 1;
    while (power < num)
      power = power << 1;
    return power;
  }

  _hash(key) {
    const strKey = String(key);
    let hash = 0;
    for (let i = 0; i < strKey.length; i++)
      hash = (hash * 31 + strKey.charCodeAt(i)) >>> 0;
    return hash ^ (hash >>> 16);
  }

  _getIndex(hash) {
    return hash & (this.capacity - 1);
  }

  put(key, value) {
    const hash = this._hash(key);
    const index = this._getIndex(hash);
    const head = this.buckets[index];

    if (!head) {
      this.buckets[index] = new Node(key, value, hash);
      this.size++;
    } else {
      let curr = head, prev = null;
      while (curr) {
        if (curr.key === key) {
          curr.value = value;
          return;
        }
        prev = curr;
        curr = curr.next;
      }
      prev.next = new Node(key, value, hash);
      this.size++;
    }

    if (this.size / this.capacity > this.loadFactor)
      this._resize();
  }

  get(key) {
    const hash = this._hash(key);
    const index = this._getIndex(hash);
    let head = this.buckets[index];

    while (head) {
      if (head.key === key)
        return head.value;
      head = head.next;
    }
    return null;
  }

  remove(key) {
    const hash = this._hash(key);
    const index = this._getIndex(hash);
    let head = this.buckets[index], prev = null;

    while (head) {
      if (head.key === key) {
        if (prev)
          prev.next = head.next;
        else
          this.buckets[index] = head.next;
        this.size--;
        return true;
      }
      prev = head;
      head = head.next;
    }
    return false;
  }

  containsKey(key) {
    return this.get(key) !== null;
  }

  _resize() {
    const oldBuckets = this.buckets;
    this.capacity *= 2;
    this.size = 0;
    this.buckets = new Array(this.capacity).fill(null);
    for (const bucket of oldBuckets) {
      let curr = bucket;
      while (curr) {
        this.put(curr.key, curr.value);
        curr = curr.next;
      }
    }
  }

  print() {
    console.log("HashMap contents:");
    for (let i = 0; i < this.capacity; i++) {
      let current = this.buckets[i];
      let chain = [];
      while (current) {
        chain.push(`(${current.key}: ${current.value})`);
        current = current.next;
      }
      if (chain.length > 0) {
        console.log(`Bucket ${i} → ${chain.join(" -> ")}`);
      }
    }
  }
}

const map = new MyHashMap(4);

map.put("A", 1);
map.put("B", 2);
map.put("C", 3);
map.put("D", 4);
map.put("E", 5); // triggers resize

console.log("Get A:", map.get("A"));
console.log("Get C:", map.get("C"));
console.log("Contains B:", map.containsKey("B"));

map.remove("B");
console.log("Contains B after removal:", map.containsKey("B"));

map.print();