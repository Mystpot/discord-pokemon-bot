// utils/helpers.js

/**
 * Generic utility functions (not specific to Pokémon or Discord)
 */

// Example: Formatting utilities
function formatNumber(num, decimals = 2) {
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

// Example: Async delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Example: Random number generator
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  formatNumber,
  sleep,
  randomInt
  // Add other generic utilities...
};