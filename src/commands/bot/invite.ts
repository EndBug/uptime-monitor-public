import * as Commando from 'discord.js-commando';
import { links } from '../../core/app';

export default class InviteCMD extends Commando.Command {
  constructor(client: Commando.CommandoClient) {
    super(client, {
      name: 'invite',
      aliases: ['inviteme', 'addme', 'invitelink'],
      group: 'bot',
      memberName: 'invite',
      description: 'Gives you the link to add the bot to your guild.',
      guildOnly: false,
      ownerOnly: false
    });
  }

  //@ts-ignore
  run(msg: Commando.CommandoMessage) {
    msg.say(`Thank you for choosing Uptime Monitor!\nPlease note that the bot/user you want to track has to be in that guild too.\nClick here to invite the bot: ${links.invite}`);
  }
}
