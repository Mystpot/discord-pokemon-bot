const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  Message,
  MessageFlags,
} = require('discord.js');
const PokemonService = require('./PokemonService');
const UIService = require('./UIService');

class PlayerService {
  static async handleStarterSelection(player, context, starterOptions) {
    try {
      // Validate player state
      if (player.hasChosenStarter) {
        throw new Error("You've already chosen a starter Pokémon!");
      }
      if (player.currentTown !== 'PalletTown') {
        throw new Error('You can only choose starters in Pallet Town!');
      }

      // Verify starter options exist
      const validStarters = starterOptions.filter((name) => {
        const pokemon = PokemonService.getPokemon(name);
        if (!pokemon) {
          console.error(`Invalid starter option: ${name}`);
          return false;
        }
        return pokemon.isStarter;
      });

      if (validStarters.length === 0) {
        throw new Error('No valid starter Pokémon available!');
      }

      // Build selection menu
      const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('starter_selection')
          .setPlaceholder('Choose your starter!')
          .addOptions(
            validStarters.map((pokemonName) => {
              const pokemon = PokemonService.getPokemon(pokemonName);
              return {
                label: pokemon.name,
                description: `${pokemon.types.join('/')} type | LV.5`,
                value: pokemon.name.toLowerCase(),
                emoji: this.getStarterEmoji(pokemon.types[0]),
              };
            })
          )
      );

      // Different handling for messages vs interactions
      let response;
      if (context instanceof Message) {
        // Now properly recognized
        response = await context.channel.send({
          content: 'Professor Oak: "Choose your first Pokémon!"',
          components: [selectMenu],
        });
      } else {
        await context.reply({
          content: 'Professor Oak: "Choose your first Pokémon!"',
          components: [selectMenu],
          fetchReply: true,
        });
        response = await context.fetchReply();
      }

      return new Promise((resolve, reject) => {
        const collector = response.channel.createMessageComponentCollector({
          filter: (i) => {
            const userId = context.author?.id || context.user?.id;
            if (i.user.id !== userId) {
              i.reply({
                content: "❌ This selection isn't for you!",
                flags: MessageFlags.Flags.EPHEMERAL,
              }).catch(() => {});
              return false;
            }
            return i.customId === 'starter_selection' && i.user.id === userId;
          },
          time: 60000,
          max: 1,
        });

        collector.on('collect', async (interaction) => {
          try {
            // Acknowledge the interaction immediately
            await interaction.deferUpdate();

            const starterName = interaction.values[0];
            const starter = this.giveStarterPokemon(player, starterName);

            // Edit the original message
            await interaction.editReply({
              content: `🎉 You chose ${starter.name}!`,
              components: [],
              embeds: [UIService.createStarterEmbed(starter)],
            });

            resolve(starter);
          } catch (error) {
            console.error('Collection error:', error);
            if (interaction.replied || interaction.deferred) {
              await interaction
                .followUp({
                  content: '❌ Selection failed!',
                  flags: MessageFlags.Flags.EPHEMERAL,
                })
                .catch(console.error);
            }
          }
        });

        collector.on('end', async (collected, reason) => {
          if (reason === 'time' && response.editable) {
            await response
              .edit({
                content: '⌛ Selection timed out.',
                components: [],
              })
              .catch(console.error);
          }
        });
      });
    } catch (error) {
      console.error('Starter selection setup failed:', error);
      throw error;
    }
  }

  static giveStarterPokemon(player, pokemonName) {
    const starter = PokemonService.createPokemon(pokemonName, 5, player.userId);
    if (!starter) throw new Error(`Invalid starter: ${pokemonName}`);

    player.pokemonTeam.push(starter);
    player.hasChosenStarter = true;
    player.inventory.push('pokedex', ...Array(5).fill('potion'));
    return starter;
  }

  static getStarterEmoji(type) {
    const emojis = { grass: '🌿', fire: '🔥', water: '💧' };
    return emojis[type.toLowerCase()] || '❓';
  }

  static createNewPlayer(userId) {
    return {
      userId,
      pokemonTeam: [],
      currentTown: 'PalletTown',
      visitedTowns: new Set(['PalletTown']),
      inventory: Array(5).fill('pokeball'),
      badges: [],
      money: 3000,
      hasChosenStarter: false,
      pokemonStorage: [],
    };
  }
}

module.exports = PlayerService;
