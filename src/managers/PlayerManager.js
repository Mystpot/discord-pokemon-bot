const Player = require('../models/Player');
const PokemonService = require('../services/PokemonService');
const PlayerService = require('../services/PlayerService');

class PlayerManager {
  constructor() {
    this.players = new Map();
    // Initialize PlayerService properly (no 'new' since methods are static)
  }

  get(userId) {
    if (!this.players.has(userId)) {
      // Use static method from PlayerService
      const newPlayer = PlayerService.createNewPlayer(userId);
      this.players.set(userId, newPlayer);
      return newPlayer;
    }
    return this.players.get(userId);
  }

  giveStarterPokemon(userId, pokemonName) {
    const player = this.get(userId);
    const starter = PokemonService.createPokemon(pokemonName, 5, userId);
    player.pokemonTeam.push(starter);
    player.hasChosenStarter = true;
    return starter;
  }

  // All original methods preserved:
  saveAllPlayers() {
    this.players.forEach((player) => {
      this.playerService.savePlayerProgress(player);
    });
  }

  getPlayersInTown(townId) {
    return [...this.players.values()].filter((p) => p.currentTown === townId);
  }
}

module.exports = PlayerManager;
