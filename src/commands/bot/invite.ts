import { Command } from '../../core/commands'
import { Message } from 'discord.js'
import { getInviteLink } from '../../utils/utils'

export default class InviteCMD extends Command {
  constructor() {
    super({
      name: 'invite',
      aliases: ['inviteme', 'add', 'addme', 'invitelink'],
      description: 'Gives you the link to add the bot to your guild.'
    })
  }

  run(msg: Message) {
    return msg.channel.send(`Thank you for choosing Uptime Monitor!\nPlease note that the permissions required in the invite are important, and that without them the bot could not work properly.\nClick here to invite the bot: ${getInviteLink()}`)
  }
}
