const PokemonService = require('./PokemonService');

class BattleService {
  static calculateDamage(attacker, defender, moveName) {
    return PokemonService.calculateDamage(attacker, defender, moveName);
  }

  static calculateMoveDelay(moveName, pokemon) {
    const move = PokemonService.getMove(moveName);
    if (!move) return 3000; // Default delay
    
    const baseDelay = move.base_delay || 3;
    const speedFactor = Math.pow(pokemon.speed / 100, move.speed_scaling || 1);
    return Math.max(1000, Math.min(10000, baseDelay * 1000 / speedFactor));
  }

  static determineBattleOutcome(playerTeam, opponentTeam) {
    const playerAlive = playerTeam.some(p => p.currentHp > 0);
    const opponentAlive = opponentTeam.some(p => p.currentHp > 0);
    
    if (!playerAlive) return 'lost';
    if (!opponentAlive) return 'won';
    return 'ongoing';
  }

  static distributeExperience(winnerTeam, loserTeam) {
    const baseExp = loserTeam.reduce((sum, pokemon) => sum + pokemon.level * 10, 0);
    return winnerTeam.map(pokemon => ({
      pokemon,
      gainedExp: Math.floor(baseExp * pokemon.level / winnerTeam.length)
    }));
  }
}

module.exports = BattleService;