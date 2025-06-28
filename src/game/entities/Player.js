const PokemonService = require('../services/PokemonService');
const PlayerService = require('../services/PlayerService');
const TownService = require('../services/TownService');

class Player {
  constructor(userId) {
    Object.assign(this, PlayerService.createNewPlayer(userId));
  }

  // Town Navigation
  moveToTown(townId) {
    if (!TownService.isConnected(this.currentTown, townId) && 
        !this.visitedTowns.has(townId)) {
      return false;
    }
    this.currentTown = townId;
    this.visitedTowns.add(townId);
    return true;
  }

  // Pokémon Management
  catchPokemon(wildPokemon, ballType = 'pokeball') {
    return PlayerService.catchPokemon(this, wildPokemon, ballType);
  }

  chooseStarter(pokemonName) {
    const starter = PokemonService.createPokemon(pokemonName, 5, this.userId);
    this.pokemonTeam.push(starter);
    return starter;
  }

  healTeam() {
    PlayerService.healTeam(this);
  }

  // Inventory
  addItem(item, quantity = 1) {
    for (let i = 0; i < quantity; i++) {
      this.inventory.push(item);
    }
  }

  useItem(item) {
    const index = this.inventory.indexOf(item);
    if (index !== -1) {
      this.inventory.splice(index, 1);
      return true;
    }
    return false;
  }

  // Progression
  addBadge(badgeName) {
    if (!this.badges.includes(badgeName)) {
      this.badges.push(badgeName);
    }
  }

  // Battle Team
  switchPokemonPositions(index1, index2) {
    if (index1 < 0 || index2 < 0 || 
        index1 >= this.pokemonTeam.length || 
        index2 >= this.pokemonTeam.length) {
      return false;
    }
    [this.pokemonTeam[index1], this.pokemonTeam[index2]] = 
      [this.pokemonTeam[index2], this.pokemonTeam[index1]];
    return true;
  }

  // Economy
  addMoney(amount) {
    this.money = Math.max(0, this.money + amount);
  }
}

module.exports = Player;