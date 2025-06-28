const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const PokemonService = require('../services/PokemonService');
const UIService = require('../services/UIService');
const PlayerService = require('../services/PlayerService');

class InteractionHandler {
  constructor(playerManager, uiService, cooldownManager) {
    this.players = playerManager;
    this.ui = uiService;
    this.cooldowns = cooldownManager;
    this.activeWild = {};
    this.activeBattles = {};
  }

  async handleInteraction(interaction) {
    try {
      if (this.cooldowns.has(interaction.user.id)) {
        return await interaction.reply({
          content: `⌛ Please wait ${this.cooldowns.getRemaining(interaction.user.id)}s before using this again.`,
          flags: MessageFlags.Flags.EPHEMERAL
        });
      }

      const player = this.players.get(interaction.user.id);
      if (!player) throw new Error("Player data not found!");

      if (interaction.isButton()) {
        await this.handleButton(interaction, player);
      } 
      else if (interaction.isStringSelectMenu()) {
        await this.handleSelectMenu(interaction, player);
      }

      this.cooldowns.add(interaction.user.id);
    } catch (error) {
      console.error(`Interaction Error [${interaction?.type}]:`, error);
      await this.handleError(interaction, error);
    }
  }

  async handleButton(interaction, player) {
    try {
      await interaction.deferUpdate();

      switch (interaction.customId) {
        case 'professor_oak':
          if (player.currentTown === 'PalletTown' && !player.hasChosenStarter) {
            const starters = ['Bulbasaur', 'Charmander', 'Squirtle'];
            await PlayerService.handleStarterSelection(player, interaction, starters);
          }
          break;

        case 'town_info':
          await this.ui.showTownInfo(interaction, player);
          break;

        case 'wild_battle':
          await this.handleWildEncounter(interaction, player);
          break;

        case 'team_view':
          await this.ui.showTeam(interaction, player);
          break;

        case 'catch_pokemon':
          await this.handleCatchAttempt(interaction, player);
          break;

        case 'run_away':
          delete this.activeWild[interaction.channel.id];
          await interaction.editReply({ 
            content: "🏃‍♂️ You ran away safely!", 
            components: [] 
          });
          break;

        case 'back_to_team':
          await this.ui.showTeam(interaction, player, true);
          break;

        case 'pokemon_move_1':
        case 'pokemon_move_2':
        case 'pokemon_move_3':
        case 'pokemon_move_4':
          const moveIndex = parseInt(interaction.customId.split('_')[2]) - 1;
          await this.showMoveDetails(interaction, player, moveIndex);
          break;

        case 'refresh_menu':
          await this.ui.showMainMenu(interaction, player);
          break;

        default:
          await interaction.followUp({
            content: "❌ Unknown button action",
            flags: MessageFlags.Flags.EPHEMERAL
          });
      }
    } catch (error) {
      throw error;
    }
  }

  async handleSelectMenu(interaction, player) {
    try {
      await interaction.deferUpdate();

      switch (interaction.customId) {
        case 'starter_selection':
          const starter = await PlayerService.completeStarterSelection(
            player, 
            interaction.values[0]
          );
          await interaction.editReply({
            content: `🎉 You chose ${starter.name}!`,
            components: [],
            embeds: [UIService.createStarterEmbed(starter)]
          });
          break;

        case 'view_pokemon_details':
          await this.showPokemonDetails(interaction, player);
          break;

        case 'npc_interact':
          await this.talkToNPC(interaction, player, interaction.values[0]);
          break;

        case 'travel_menu':
          await this.travelToTown(interaction, player, interaction.values[0]);
          break;

        default:
          await interaction.followUp({
            content: "❌ Unknown menu action",
            flags: MessageFlags.Flags.EPHEMERAL
          });
      }
    } catch (error) {
      throw error;
    }
  }

  async handleWildEncounter(interaction, player) {
    if (this.activeWild[interaction.channel.id]) {
      throw new Error("There's already an active wild encounter!");
    }

    const wildPokemon = PokemonService.generateWildPokemon(player.currentTown);
    this.activeWild[interaction.channel.id] = wildPokemon;

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('catch_pokemon')
        .setLabel('Catch!')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('run_away')
        .setLabel('Run Away')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({
      content: `🌿 A wild ${wildPokemon.name} (Lvl ${wildPokemon.level}) appeared!`,
      components: [actionRow]
    });
  }

  async handleCatchAttempt(interaction, player) {
    const wildPokemon = this.activeWild[interaction.channel.id];
    if (!wildPokemon) throw new Error("No Pokémon to catch!");

    const result = PlayerService.catchPokemon(player, wildPokemon);
    delete this.activeWild[interaction.channel.id];

    await interaction.editReply({
      content: result.success 
        ? `🎉 ${interaction.user.username} caught ${wildPokemon.name}!` 
        : `❌ ${result.message}`,
      components: []
    });

    if (result.success) {
      await this.ui.showTeam(interaction, player, true);
    }
  }

  async showPokemonDetails(interaction, player) {
    const selectedIndex = parseInt(interaction.values[0].split('_')[1]);
    const pokemon = player.pokemonTeam[selectedIndex];
    
    await interaction.editReply({ 
      embeds: [UIService.buildPokemonEmbed(pokemon)],
      components: [this.createPokemonActionRow(pokemon)],
      ephemeral: true
    });
  }

  createPokemonActionRow(pokemon) {
    return new ActionRowBuilder().addComponents(
      ...pokemon.moves.slice(0,4).map((move, i) => 
        new ButtonBuilder()
          .setCustomId(`pokemon_move_${i+1}`)
          .setLabel(move.name)
          .setStyle(ButtonStyle.Secondary)
      ),
      new ButtonBuilder()
        .setCustomId('back_to_team')
        .setLabel('Back to Team')
        .setStyle(ButtonStyle.Primary)
    );
  }

  async handleError(interaction, error) {
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: `❌ Error: ${error.message}`,
          flags: MessageFlags.Flags.EPHEMERAL
        });
      } else {
        await interaction.reply({
          content: `❌ Error: ${error.message}`,
          flags: MessageFlags.Flags.EPHEMERAL
        });
      }
    } catch (err) {
      console.error('Failed to send error:', err);
    }
  }
}

module.exports = InteractionHandler;