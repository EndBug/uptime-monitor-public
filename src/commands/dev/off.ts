import { Command } from '../../core/commands'
import { Message } from 'discord.js'

export default class OffCMD extends Command {
  constructor() {
    super({
      name: 'off',
      aliases: ['shutdown'],
      description: 'Turns off the bot.',
      guildOnly: false,
      ownerOnly: true
    })
  }

  async run(msg: Message) {
    await msg.channel.send('The bot will shut down in moments.')

    this.client.destroy()
    process.exit()
    return null
  }
}
