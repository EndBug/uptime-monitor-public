import { owner } from '../../core/app'
import { Command } from '../../core/commands'
import { Message } from 'discord.js'
import { getSupportLink } from '../../utils/utils'

export default class SupportCMD extends Command {
  constructor() {
    super({
      name: 'support',
      aliases: ['supportguild', 'supportserver', 'feedback', 'issue'],
      description: 'Gives you the invite to enter in the official Uptime Monitor support server.'
    })
  }

  async run(msg: Message) {
    const invite = await getSupportLink()
    if (!invite) {
      owner.send(`Problem with invite creation: ${invite}`)
      return msg.channel.send('Sorry, this command is temporarily unavailable, please retry later.\nIronic, huh?')
    } else return msg.channel.send(`Thank you for choosing Uptime Monitor!\nYou can enter in the support guild through this invite: ${invite}`)
  }
}
