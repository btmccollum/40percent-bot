import config from './config.js';
import {
  Client,
  User,
  Message,
  MessageReaction,
  PartialMessageReaction,
  Intents,
} from 'discord.js';
import handleShowcaseMessage from './handlers/showcase';
import handleSoundtestMessage from './handlers/soundtest';
import {
  handleIcGbRequestMessage,
  handleIcGbReviewReaction,
  handleProjectAnnouncementReaction,
} from './handlers/project';
import fetchPartial from './utils/fetchPartial';
import callHandlers from './utils/callHandlers.js';

function messageShouldBeHandled(msg: Message): boolean {
  // Ignore messages from bots
  // Ignore messages from DMs
  return !msg.author.bot && msg.guild?.id === config.FORTIES_GUILD;
}

function reactionShouldBeHandled(
  reaction: MessageReaction | PartialMessageReaction,
  user: User
) {
  // Ignore reactions from bots
  // Ignore reactions from DMs
  return !user.bot && reaction.message.guild?.id === config.FORTIES_GUILD;
}

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'],
});

client.once('ready', () => {
  console.log('==== READY ====');
});

client.on('error', (err) => {
  console.log('Uncaught error:', err);
});

client.on('message', async (msg) => {
  await fetchPartial(msg);

  if (!messageShouldBeHandled(msg)) return;

  await callHandlers(
    handleShowcaseMessage(msg, client),
    handleSoundtestMessage(msg, client),
    handleIcGbRequestMessage(msg, client)
  );
});

client.on('messageReactionAdd', async (reaction, user) => {
  await Promise.all([fetchPartial(reaction), fetchPartial(user)]);

  if (!reactionShouldBeHandled(reaction, user as User)) return;

  await callHandlers(
    handleIcGbReviewReaction(reaction, client, user as User),
    handleProjectAnnouncementReaction(reaction, user as User, 'add')
  );
});

client.on('messageReactionRemove', async (reaction, user) => {
  await Promise.all([fetchPartial(reaction), fetchPartial(user)]);

  if (!reactionShouldBeHandled(reaction, user as User)) return;

  await callHandlers(
    handleProjectAnnouncementReaction(reaction, user as User, 'remove')
  );
});

void client.login(config.BOT_TOKEN);
