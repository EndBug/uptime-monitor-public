import { client, owner } from '../core/app';
import { getSupportInvite } from '../utils/utils';

client.on('guildCreate', async guild => {
  const invite = await getSupportInvite();
  if (!invite) return owner.send(`Problem with invite creation: ${invite}`);

  const msg = `Hi, thanks for choosing Uptime Monitor! Let me introduce you to the basics:
  
  - You can run commands by typing \`<@mention> command\` (in a guild) or \`command\` (in this DM).
  - To know more about commands you can use \`help\`: it'll tell you which commands you can use.

  To start tracking someone, use the \`add\` command in the channel you want to get notifications in. You can find more info on that command with \`help add\`
  
  Please note that the bot needs to be connected to the users/bots you want to track through at least one guild.
  If you need some help or you have suggestions, please join the support guild: ${invite}
  
  If you want to share this bot, please use the \`invite\` command and use that link ;)
  `;

  guild.owner.send(msg);
});