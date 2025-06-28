require('dotenv').config();
const { Client, GatewayIntentBits, Partials, MessageFlags } = require('discord.js');
const CommandHandler = require('./handlers/CommandHandler');
const InteractionHandler = require('./handlers/InteractionHandler');
const PlayerManager = require('./managers/PlayerManager');
const CooldownManager = require('./managers/CooldownManager');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ]
});

// Initialize core systems
const cooldowns = new CooldownManager();
const playerManager = new PlayerManager();
const uiService = new (require('./services/UIService'))();

// Initialize handlers with dependencies
const commandHandler = new CommandHandler(playerManager, uiService, cooldowns);
const interactionHandler = new InteractionHandler(playerManager, uiService, cooldowns);

// Event handlers
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`Serving ${client.guilds.cache.size} guilds`);
  client.user.setActivity('Pokémon Adventures', { type: 'PLAYING' });
});

client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;
    await commandHandler.handleMessage(message);
  } catch (error) {
    console.error('Message handling error:', error);
    if (!message.deleted) {
      message.channel.send({
        content: '❌ An error occurred processing your command',
        flags: MessageFlags.Flags.EPHEMERAL
      }).catch(console.error);
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    await interactionHandler.handleInteraction(interaction);
  } catch (error) {
    console.error('Interaction handling error:', error);
    if (interaction.isRepliable() && !interaction.replied) {
      interaction.reply({
        content: '❌ An error occurred processing your interaction',
        flags: MessageFlags.Flags.EPHEMERAL,
        ephemeral: true
      }).catch(console.error);
    }
  }
});

client.login(process.env.DISCORD_TOKEN)
  .catch(error => {
    console.error('Login failed:', error);
    process.exit(1);
  });