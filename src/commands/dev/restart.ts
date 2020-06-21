import { writeFileSync } from 'fs'
import { join as path } from 'path'
import { Message } from 'discord.js'
import { Command } from '../../core/commands'

export default class RestartCMD extends Command {
  constructor() {
    super({
      name: 'restart',
      aliases: ['rs'],
      description: 'Restarts the bot.',
      guildOnly: false,
      ownerOnly: true
    })
  }

  async run(msg: Message) {
    await msg.channel.send('nThe bot will restart in moments.')

    writeFileSync(path(__dirname, '../../utils/reloadme.json'), JSON.stringify({ date: new Date() }))

    return null
  }
}
