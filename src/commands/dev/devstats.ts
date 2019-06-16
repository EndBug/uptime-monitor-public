import * as Commando from 'discord.js-commando';

import { client } from '../../core/app';

export default class DevStatsCMD extends Commando.Command {
  constructor(client: Commando.CommandoClient) {
    super(client, {
      name: 'devstats',
      group: 'dev',
      memberName: 'devstats',
      description: 'Gives some usefult stats about the bot.',
      args: [{
        key: 'mode',
        prompt: 'One of: servers/guilds, database/db',
        type: 'string',
        oneOf: ['servers', 'guilds', 'database', 'db']
      }],
      guildOnly: false,
      ownerOnly: true
    });
  }

  //@ts-ignore
  run(msg: Commando.CommandoMessage, { mode }) {
    if (['servers', 'guilds'].includes(mode)) {
      const text = `The bot is now in ${client.guilds.size} guilds:\n` + '```\n' + client.guilds.array().join(', ') + '\n```';
      msg.say(text);
    } else if (['database', 'db', 'list'].includes(mode)) {
      //@ts-ignore
      const list = client.provider.get('global', 'targetList', {});
      msg.say('Here is the current list:\n' +
        '```json\n' + JSON.stringify(list) + '\n```');
    }
  }
}
