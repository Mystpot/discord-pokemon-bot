const PokemonService = require('../services/PokemonService');
const TownService = require('../services/TownService');
const TimeService = require('../services/TimeService');

class Wild {
  constructor() {
    this.encounters = {}; // { channelId: { pokemon, timestamp } }
  }

  spawn(channelId, townId) {
    const possiblePokemon = TownService.getWildPokemon(townId, TimeService.getTimeOfDay());
    if (possiblePokemon.length === 0) return null;

    this.removeOldEncounter(channelId);

    const wildPokemon = PokemonService.createWildPokemon(
      possiblePokemon[Math.floor(Math.random() * possiblePokemon.length)],
      this.calculateWildLevel(townId)
    );

    this.encounters[channelId] = {
      pokemon: wildPokemon,
      timestamp: Date.now()
    };

    return wildPokemon;
  }

  get(channelId) {
    const encounter = this.encounters[channelId];
    if (!encounter || this.isEncounterExpired(encounter.timestamp)) {
      this.removeOldEncounter(channelId);
      return null;
    }
    return encounter.pokemon;
  }

  removeOldEncounter(channelId) {
    delete this.encounters[channelId];
  }

  calculateWildLevel(townId) {
    const townOrder = ["PalletTown", "ViridianCity", "PewterCity", "CeruleanCity"];
    const baseLevel = (townOrder.indexOf(townId) + 1) * 3;
    return Math.max(2, baseLevel + Math.floor(Math.random() * 5) - 2);
  }

  isEncounterExpired(timestamp) {
    return Date.now() - timestamp > 15 * 60 * 1000; // 15 minute expiration
  }
}

module.exports = Wild;