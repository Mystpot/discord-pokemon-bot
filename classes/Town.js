const TownService = require('../services/TownService');
const PlayerService = require('../services/PlayerService');

class Town {
  constructor(townId, player) {
    this.id = townId;
    this.data = TownService.getTown(townId);
    this.player = player;
    this.completedEvents = new Set();
  }

  getCurrentEvents() {
    return TownService.getTownEvents(this.id).filter(event => {
      if (this.completedEvents.has(event.id)) return false;
      
      switch(event.trigger) {
        case 'first_visit':
          return !this.player.hasVisited(this.id);
        case 'after_gym':
          return TownService.isGymCompleted(this.id, this.player);
        default:
          return true;
      }
    });
  }

  handleEvent(eventId) {
    const event = TownService.getEvent(this.id, eventId);
    if (!event) return null;
    
    event.actions?.forEach(action => {
      switch(action.type) {
        case 'give_starter':
          PlayerService.handleStarterSelection(this.player);
          break;
        case 'add_item':
          PlayerService.addItem(this.player, action.item);
          break;
      }
    });
    
    this.completedEvents.add(eventId);
    return event.dialogue;
  }

  getNPCResponse(npcId) {
    return TownService.getNPCDialogue(
      npcId, 
      this.player.hasStarter()
    );
  }

  canAccessGym() {
    return TownService.canChallengeGym(this.id, this.player);
  }
}

module.exports = Town;