import { client, settings } from '../../core/app'
import { Command } from '../../core/commands'
import { Message } from 'discord.js'
import { enforceType } from '../../utils/utils'

const modes = {
  db: ['database'],
  g: ['servers', 'guilds'],
  rs: ['lastreload', 'lastrestart', 'reload', 'restart']
}

Object.freeze(modes)

export default class DevStatsCMD extends Command {
  constructor() {
    super({
      name: 'devstats',
      description: 'Gives some usefult stats about the bot.',
      aliases: ['info'],
      args: [{
        key: 'mode',
        prompt: `One of: ${Object.keys(modes).map(key => `\`${key}\``).join(', ')}`,
        validate: str => !!checkMode(str)
      }],
      ownerOnly: true
    })
  }

  async run(msg: Message, [mode]: [string]) {
    const m = checkMode(mode)
    switch (m) {
      case 'g': {
        let text = `The bot is now in ${client.guilds.cache.size} guilds:\n`
          + '```\n'
          + client.guilds.cache.array()
            .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime())
            .join(', ')
          + '\n```'
        if (text.length > 2000)
          text = text.substr(0, 2000 - 7) + '...\n```'

        return msg.channel.send(text)
      }

      case 'db': {
        const stats = await settings.get('targets')

        const str = `The bot is currently tracking ${Object.keys(stats).length} bots/users.`

        return msg.channel.send(str)
      }

      case 'rs': {
        const dateStr = require('../../utils/reloadme.json')?.date,
          result = dateStr ? (new Date(dateStr)).toString() : '???'
        return msg.channel.send(`Last reload: ${result}`)
      }
    }
  }
}

function checkMode(value: string) {
  const res = Object.keys(modes).find(m => m == value || modes[m].includes(value))
  if (enforceType<keyof typeof modes>(res)) return res
}
