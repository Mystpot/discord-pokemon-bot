const townData = require('../data/towns.json');
const npcData = require('../data/npcs.json');
const TimeService = require('./TimeService');

class TownService {
  static getTown(townId) {
    return townData[townId] || null;
  }

  static getWildPokemon(townId, timeOfDay = null) {
    const town = this.getTown(townId);
    if (!town) return [];
    
    const timeKey = timeOfDay ? `wildPokemon_${timeOfDay}` : 'wildPokemon';
    return town[timeKey] || town.wildPokemon || [];
  }

  static getCurrentWildPokemon(townId) {
    return this.getWildPokemon(townId, TimeService.getTimeOfDay());
  }

  static isConnected(townA, townB) {
    const town = this.getTown(townA);
    return town?.connections?.includes(townB) || false;
  }

  static getGymLeader(townId) {
    const town = this.getTown(townId);
    return town?.gym?.leader || null;
  }

  static getNPC(npcId) {
    return npcData[npcId] || null;
  }

  static getTownActions(townId) {
    const town = this.getTown(townId);
    if (!town) return [];
    
    return [
      town.npcs?.length ? 'Talk to NPCs' : null,
      town.wildPokemon ? 'Wild Pokémon' : null,
      town.gym ? 'Gym Challenge' : null
    ].filter(Boolean);
  }

  static getTownEvents(townId) {
    const town = this.getTown(townId);
    return town?.events || [];
  }

  static getEvent(townId, eventId) {
    return this.getTownEvents(townId).find(e => e.id === eventId);
  }

  static isGymCompleted(townId, player) {
    const gym = this.getTown(townId)?.gym;
    return gym ? player.hasBadge(gym.badge) : false;
  }

  static canChallengeGym(townId, player) {
    const gym = this.getTown(townId)?.gym;
    if (!gym) return false;
    
    return gym.requirements.every(req => {
      if (req.startsWith('defeat_')) {
        return player.hasDefeated(req.replace('defeat_', ''));
      }
      return true;
    });
  }

  static getNPCDialogue(npcId, hasStarter = false) {
    const npc = this.getNPC(npcId);
    if (!npc) return "Hello there!";
    return hasStarter && npc.dialogue.post_starter 
      ? npc.dialogue.post_starter 
      : npc.dialogue.default;
  }
}

module.exports = TownService;