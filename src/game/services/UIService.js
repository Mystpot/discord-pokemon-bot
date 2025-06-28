const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder 
} = require('discord.js');
const PokemonService = require('./PokemonService');
const TownService = require('./TownService');

class UIService {
  // Progress Visualization
  static createProgressBar(current, max, length = 10) {
    const filled = Math.max(0, Math.round((current / max) * length));
    return `[${'■'.repeat(filled)}${' '.repeat(length - filled)}]`;
  }

  static createHpBar(current, max) {
    return `${this.createProgressBar(current, max)} ${current}/${max}`;
  }

  static createXpBar(currentXp, xpToNextLevel) {
    const percentage = Math.floor((currentXp / xpToNextLevel) * 100);
    return `[${'■'.repeat(Math.floor(percentage/10))}${' '.repeat(10 - Math.floor(percentage/10))}] ${percentage}%`;
  }

  // Battle Displays
  static buildBattleText(playerPokemon, opponentPokemon, battleLog = []) {
    return [
      `⚔️ **BATTLE** ⚔️`,
      `🎮 ${playerPokemon.name} (Lvl ${playerPokemon.level}) ${this.createHpBar(playerPokemon.currentHp, playerPokemon.maxHp)}`,
      `🦁 ${opponentPokemon.name} (Lvl ${opponentPokemon.level}) ${this.createHpBar(opponentPokemon.currentHp, opponentPokemon.maxHp)}`,
      ...battleLog.slice(-3)
    ].join('\n');
  }

  static buildBattleMoveSelect(pokemon, isDisabled = false) {
    return new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('battle_move_select')
        .setPlaceholder('Select a move...')
        .setDisabled(isDisabled)
        .addOptions(
          pokemon.moves.map(move => ({
            label: move.name,
            description: `${move.type} | Pwr:${move.power || '---'}`,
            value: move.name
          }))
        )
    );
  }

  // Pokémon Displays
  static buildPokemonEmbed(pokemon) {
    const evolutionInfo = PokemonService.getEvolutionInfo(pokemon.name);

    return new EmbedBuilder()
      .setTitle(`${pokemon.name} (Lvl ${pokemon.level})`)
      .setThumbnail(PokemonService.getOfficialArtwork(pokemon.name))
      .addFields(
        { 
          name: 'Types', 
          value: pokemon.types.map(t => `${t} ${PokemonService.getTypeEmoji(t)}`).join(' '), 
          inline: true 
        },
        { name: 'HP', value: this.createHpBar(pokemon.currentHp, pokemon.maxHp), inline: true },
        { name: 'Stats', value: this.buildStatLine(pokemon), inline: false },
        { name: 'XP Progress', value: this.createXpBar(pokemon.currentXp, pokemon.xpToNextLevel) },
        { 
          name: 'Evolution', 
          value: evolutionInfo ? 
            `Evolves to ${evolutionInfo.evolvesTo} at Lvl ${evolutionInfo.level}` : 
            'Does not evolve' 
        }
      );
  }

  static buildStatLine(pokemon) {
    return `⚔️ Atk: ${pokemon.attack} | 🛡️ Def: ${pokemon.defense}\n` +
           `✨ Sp.Atk: ${pokemon.specialAttack} | 🔮 Sp.Def: ${pokemon.specialDefense}\n` +
           `🏃 Speed: ${pokemon.speed}`;
  }

  // Team Management
  static async showTeam(context, player, isUpdate = false) {
    if (player.pokemonTeam.length === 0) {
      throw new Error("You don't have any Pokémon yet!");
    }

    const response = {
      content: '**Your Pokémon Team**',
      components: [this.buildTeamSelectMenu(player)],
      ephemeral: true
    };

    if (isUpdate || context.replied || context.deferred) {
      await context.editReply(response);
    } else {
      await context.reply(response);
    }
  }

  static buildTeamSelectMenu(player) {
    return new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('view_pokemon_details')
        .setPlaceholder('Select a Pokémon...')
        .addOptions(
          player.pokemonTeam.map((p, i) => ({
            label: `${p.name} (Lvl ${p.level})`,
            description: `HP: ${p.currentHp}/${p.maxHp}`,
            value: `pokemon_${i}`,
            emoji: PokemonService.getTypeEmoji(p.types[0])
          }))
        )
    );
  }

  // Main Menu System
  static async showMainMenu(context, player, isUpdate = false) {
    const town = TownService.getTown(player.currentTown);
    if (!town) throw new Error("Invalid town data!");

    const response = {
      content: this.buildMenuContent(context, town, player),
      components: this.buildMenuComponents(town, player),
      ephemeral: false
    };

    if (isUpdate || context.replied || context.deferred) {
      await context.editReply(response);
    } else {
      await context.reply(response);
    }
  }

  static buildMenuContent(context, town, player) {
    const user = context.user || context.author;
    return [
      `**${user.username}'s Pokémon Adventure**`,
      `📍 **Location:** ${town.name}`,
      `👥 **Team:** ${player.pokemonTeam.length}/6 Pokémon`,
      `🏆 **Badges:** ${player.badges.length}/8`,
      `💰 **Money:** ₽${player.money}`,
      `\nWhat would you like to do?`
    ].join('\n');
  }

  static buildMenuComponents(town, player) {
    const components = [this.buildMainActionRow(player)];
    
    if (town.npcs?.length) {
      components.push(this.buildNpcRow(town));
    }

    if (town.connections?.length) {
      components.push(this.buildTravelRow(town, player));
    }

    return components;
  }

  static buildMainActionRow(player) {
    const hasPokemon = player.pokemonTeam.length > 0;
    
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('town_info')
        .setLabel('📍 Town Info')
        .setStyle(ButtonStyle.Primary),
      
      new ButtonBuilder()
        .setCustomId('wild_battle')
        .setLabel('🌿 Wild Encounter')
        .setStyle(hasPokemon ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(!hasPokemon),
      
      new ButtonBuilder()
        .setCustomId('team_view')
        .setLabel('👥 View Team')
        .setStyle(hasPokemon ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(!hasPokemon),
      
      new ButtonBuilder()
        .setCustomId('refresh_menu')
        .setLabel('🔄 Refresh')
        .setStyle(ButtonStyle.Secondary)
    );
  }

static getOfficialArtwork(pokemonName) {
  const pokemonId = PokemonService.getPokemonId(pokemonName);
  if (!pokemonId) {
    console.error(`No ID found for Pokémon: ${pokemonName}`);
    return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'; // Default image
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
}

static createStarterEmbed(pokemon) {
  const embed = new EmbedBuilder()
    .setTitle(`You chose ${pokemon.name}!`)
    .setDescription(`Your ${pokemon.name} adventure begins!`)
    .addFields(
      { name: 'Type', value: pokemon.types.join('/'), inline: true },
      { name: 'Level', value: pokemon.level.toString(), inline: true }
    )
    .setColor('#00FF00');
    
  try {
    const artwork = this.getOfficialArtwork(pokemon.name);
    if (artwork) {
      embed.setThumbnail(artwork);
    }
  } catch (error) {
    console.error('Failed to set artwork:', error);
  }
  
  return embed;
}

  static buildNpcRow(town) {
    return new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('npc_interact')
        .setPlaceholder('💬 Talk to NPC...')
        .addOptions(
          town.npcs.map(npc => ({
            label: (npc.name?.substring(0, 25) || npc.id.substring(0, 25)),
            description: `Talk to ${npc.name || npc.id}`.substring(0, 50),
            value: npc.id,
            emoji: '💬'
          }))
        )
    );
  }

  static buildTravelRow(town, player) {
    return new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('travel_menu')
        .setPlaceholder('✈️ Travel to...')
        .addOptions(
          town.connections.map(townId => ({
            label: townId.substring(0, 25),
            description: player.visitedTowns.has(townId) ? 'Visited location' : 'New location',
            value: townId,
            emoji: player.visitedTowns.has(townId) ? '✅' : '🆕'
          }))
        )
    );
  }
}

module.exports = UIService;