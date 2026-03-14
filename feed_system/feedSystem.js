class Post {
  static postIdCounter = 1;
  constructor(userId, content) {
    this.id = Post.postIdCounter++;
    this.userId = userId;
    this.content = content;
    this.timestamp = Date.now();
  }

  getUserId() {
    return this.userId;
  }

  getContent() {
    return this.content;
  }

  getTimestamp() {
    return this.timestamp;
  }
}

class User {
  constructor(userId) {
    this.userId = userId;
    this.following = new Set();
  }

  getUserId() {
    return this.userId;
  }

  follow(userId) {
    this.following.add(userId);
  }

  unfollow(userId) {
    this.following.delete(userId);
  }

  getFollowing() {
    return this.following;
  }
}

class PostService {
  constructor() {
    this.userPosts = new Map();
  }

  createPost(userId, content) {
    if (!this.userPosts.has(userId))
      this.userPosts.set(userId, []);
    const post = new Post(userId, content);
    this.userPosts.get(userId).push(post);
    return post;
  }

  getPostsByUser(userId) {
    return this.userPosts.get(userId) || [];
  }
}

class FollowService {
  constructor() {
    this.users = new Map();
  }

  getOrCreateUser(userId) {
    if (!this.users.has(userId))
      this.users.set(userId, new User(userId));
    return this.users.get(userId);
  }

  follow(followerId, followeeId) {
    const follower = this.getOrCreateUser(followerId);
    follower.follow(followeeId);
  }

  unfollow(followerId, followeeId) {
    const follower = this.getOrCreateUser(followerId);
    follower.unfollow(followeeId);
  }

  getFollowing(userId) {
    const user = this.getOrCreateUser(userId);
    return user.getFollowing();
  }
}

class FeedService {
  constructor(postService, followService) {
    this.postService = postService;
    this.followService = followService;
  }

  getFeed(userId, limit = 10) {
    const following = this.followService.getFollowing(userId);
    const maxHeap = new Maxheap((a, b) => a.post.getTimestamp() - b.post.getTimestamp());

    for (const followeeId of following) {
      const posts = this.postService.getPostsByUser(followeeId);
      if (posts.length > 0) {
        const index = posts.length - 1;
        maxHeap.push({
          userId: followeeId,
          post: posts[index],
          index,
        });
      }
    }

    const result = [];
    while (maxHeap.size() > 0 && result.length < limit) {
      const { post, userId, index } = maxHeap.pop();
      result.push(post);
      if (index > 0) {
        const posts = this.postService.getPostsByUser(userId);
        maxHeap.push({
          userId,
          post: posts[index - 1],
          index: index - 1,
        });
      }
    }
    return result;
  }
}

class Maxheap {
  constructor(compare) {
    this.compare = compare;
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }

  push(val) {
    this.heap.push(val);
    this.bubbleUp();
  }

  pop() {
    if (this.size() === 0)
      return null;
    if (this.size() === 1)
      return this.heap.pop();

    const top = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown();
    return top;
  }

  bubbleUp() {
    let index = this.size() - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[parent], this.heap[index]) >= 0)
        return;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }

  bubbleDown() {
    const length = this.size();
    let index = 0;
    while (true) {
      let left = 2 * index + 1, right = 2 * index + 2, largest = index;
      if (left < length && this.compare(this.heap[largest], this.heap[left]) < 0)
        largest = left;
      if (right < length && this.compare(this.heap[largest], this.heap[right]) < 0)
        largest = right;

      if (largest === index)
        break;
      [this.heap[largest], this.heap[index]] = [this.heap[index], this.heap[largest]];
      index = largest;
    }
  }
}

class NewsFeedSystem {
  constructor() {
    this.postService = new PostService();
    this.followService = new FollowService();
    this.feedService = new FeedService(this.postService, this.followService);
  }

  follow(followerId, followeeId) {
    this.followService.follow(followerId, followeeId);
  }

  unfollow(followerId, followeeId) {
    this.followService.unfollow(followerId, followeeId);
  }

  getFeed(userId, limit) {
    return this.feedService.getFeed(userId, limit);
  }

  createPost(userId, content) {
    this.postService.createPost(userId, content);
  }
}

const system = new NewsFeedSystem();

system.follow("A", "B");
system.follow("A", "C");

system.createPost("B", "B1");
system.createPost("C", "C1");
system.createPost("B", "B2");
system.createPost("C", "C2");

const feed = system.getFeed("A", 3);

for (let post of feed) {
  console.log(post.getUserId(), post.getContent());
}