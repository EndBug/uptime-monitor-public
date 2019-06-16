import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando'; // eslint-disable-line no-unused-vars
import { User } from 'discord.js'; // eslint-disable-line no-unused-vars

import { error, findTarget, removeTarget } from '../../core/app';

interface args {
  identifier: string | User
}

export default class RemoveCMD extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'remove',
      aliases: ['stop', 'stoptracking'],
      group: 'um',
      memberName: 'remove',
      description: 'Removes a user or bot from the tracked targets.',
      args: [{
        key: 'identifier',
        prompt: 'The ID or the mention of the user or bot you want to remove.',
        type: 'user|string',
      }],
      guildOnly: true,
      ownerOnly: false
    });
  }

  //@ts-ignore
  async run(msg: CommandoMessage, { identifier }: args) {
    msg.channel.startTyping();

    const id = identifier instanceof User ? identifier.id : identifier;
    const target = findTarget(id, msg.author.id);

    if (!target) {
      msg.reply('You\'re not currently tracking that user.');
      msg.channel.stopTyping();
    } else {
      removeTarget(target).then(() => {
        msg.reply(':white_check_mark: Your target has been successfully removed.');
      }).catch((e) => {
        msg.reply('Ooops, there\'s been a problem with your request. The bot owner has already been notified, please try again later.');
        error('remove command', e);
      }).finally(() => {
        msg.channel.stopTyping();
      });
    }
  }
}