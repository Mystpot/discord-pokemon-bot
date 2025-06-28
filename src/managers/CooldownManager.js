class CooldownManager {
  constructor() {
    this.cooldowns = new Map();
  }

  checkCooldown(userId, cooldownTime = 1000) {
    const now = Date.now();
    const lastUsed = this.cooldowns.get(userId) || 0;

    if (now - lastUsed < cooldownTime) {
      return false;
    }

    this.cooldowns.set(userId, now);
    return true;
  }

  clearExpired() {
    // Optional: Periodically clean up old entries
  }
}

module.exports = CooldownManager;