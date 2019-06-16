import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando'; // eslint-disable-line no-unused-vars
import { User } from 'discord.js'; // eslint-disable-line no-unused-vars

import { addTarget, error } from '../../core/app';
import { TargetLike } from '../../custom/types'; // eslint-disable-line no-unused-vars
import { isTextChannel } from '../../utils/utils';

interface args {
  target: string | User
  timeout: number
}

export default class AddCMD extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'add',
      aliases: ['track'],
      group: 'um',
      memberName: 'add',
      description: 'Adds a new user or bot to the tracked targets.',
      args: [{
        key: 'target',
        prompt: 'The target you want to add.',
        type: 'user|string',
      }, {
        key: 'timeout',
        prompt: 'The number of minutes the target has to be offline before the bot notifies you',
        type: 'integer',
        min: 0
      }],
      guildOnly: true,
      ownerOnly: false
    });
  }

  //@ts-ignore
  async run(msg: CommandoMessage, { target, timeout }: args) {
    msg.channel.startTyping();
    const targetID = (target instanceof User) ? target.id : target;
    const user = await this.client.fetchUser(targetID);
    if (!user) {
      msg.reply(`I can't find the account you want to add (id: ${targetID}). Please check that I have at least one guild in common with them.`);
      msg.channel.stopTyping();
      return;
    }

    const send_to = isTextChannel(msg.channel) ? `${msg.guild.id}/${msg.channel.id}` : undefined;

    const structure: TargetLike = [user.tag, targetID, timeout, msg.author.id, send_to];

    addTarget(structure)
      .then(() => {
        msg.reply(':white_check_mark: Your target has been successfully added.');
      }).catch((e) => {
        msg.reply('Ooops, there\'s been a problem with your request. The bot owner has already been notified, please try again later.');
        error('add command', e);
      }).finally(() => {
        msg.channel.stopTyping();
      });
  }
}