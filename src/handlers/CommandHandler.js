const { MessageFlags } = require('discord.js');

class CommandHandler {
  constructor(playerManager, uiService, cooldownManager) {
    this.players = playerManager;
    this.ui = uiService;
    this.cooldowns = cooldownManager;
  }

  async handleMessage(message) {
    try {
      if (message.author.bot) return;
    
      const content = message.content.toLowerCase().trim();
      const player = this.playerManager.get(message.author.id); // Changed from this.players to this.playerManager
    
      if (content === '!start') {
        if (player.currentTown === 'PalletTown' && !player.hasChosenStarter) {
          const starters = ['bulbasaur', 'charmander', 'squirtle'];
        
          // Create selection menu
          const row = new ActionRowBuilder()
            .addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('starter_select')
                .setPlaceholder('Choose your starter!')
                .addOptions(
                  starters.map(pokemon => ({
                    label: pokemon.charAt(0).toUpperCase() + pokemon.slice(1),
                    value: pokemon
                  }))
                )
            );

          const reply = await message.channel.send({
            content: 'Professor Oak: "Choose your first Pokémon!"',
            components: [row]
          });

          // Handle selection
          const collector = message.channel.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id && i.customId === 'starter_select',
            time: 60000
          });

          collector.on('collect', async interaction => {
            try {
              await interaction.deferUpdate();
              const selected = interaction.values[0];
              const starter = this.playerManager.giveStarterPokemon(message.author.id, selected);
            
              await interaction.editReply({
                content: `🎉 You chose ${starter.name}!`,
                components: [],
                embeds: [this.ui.createStarterEmbed(starter)]
              });
            } catch (error) {
              console.error('Starter selection error:', error);
              await interaction.followUp({
                content: '❌ Failed to select starter',
                ephemeral: true
              });
            }
          });

        } else {
          await this.ui.showMainMenu(message, player);
        }
      }
    } catch (error) {
      console.error('Command handling error:', error);
      if (!message.deleted) {
        await message.channel.send({
          content: '❌ An error occurred processing your command',
          flags: MessageFlags.Flags.EPHEMERAL
        }).catch(console.error);
      }
    }
  }
}

module.exports = CommandHandler;