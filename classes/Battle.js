const { ActionRowBuilder } = require('discord.js');
const BattleService = require('../services/BattleService');
const UIService = require('../services/UIService');

class Battle {
  constructor(playerPokemon, opponentPokemon, channel) {
    this.playerPokemon = { ...playerPokemon };
    this.opponentPokemon = { ...opponentPokemon };
    this.channel = channel;
    this.log = [];
    this.message = null;
    this.state = 'active'; // 'active', 'player-won', 'opponent-won'
  }

  async start() {
    this.message = await this.channel.send("Starting battle...");
    await this.updateBattleUI();
  }

  async executeMove(attacker, defender, moveName) {
    const result = BattleService.calculateBattleTurn(attacker, defender, moveName);
    this.log.push(result.message);

    if (result.fainted) {
      this.state = attacker === this.playerPokemon ? 'player-won' : 'opponent-won';
    }

    await this.updateBattleUI();
    return result;
  }

  async updateBattleUI() {
    if (!this.message) return;

    await this.message.edit({
      content: UIService.buildBattleText(
        this.playerPokemon, 
        this.opponentPokemon, 
        this.log
      ),
      components: [UIService.buildBattleMoveSelect(
        this.playerPokemon,
        this.state !== 'active'
      )]
    });
  }

  distributeRewards() {
    if (this.state === 'player-won') {
      return BattleService.distributeExperience(
        [this.playerPokemon],
        [this.opponentPokemon]
      );
    }
    return [];
  }
}

module.exports = Battle;