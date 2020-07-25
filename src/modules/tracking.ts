/* Example strucutres

Target options:
{
  id: string
  authorID: string // user that set up the notification (if they want to send in a guild they need the admin permission)

  delay?: number // ms to wait before sending notification
  channel: {
    type: 'text' | 'dm'

    // when text
    channelID: string
  }
}

Database ID = 
Text Channel -> TargetID + GuildID + ChannelID
DM -> TargetID + AuthorID
*/

import { settings, alert, client } from '../core/app'
import { canSendTo } from '../utils/utils'

interface TargetOptions {
  id: string
  authorID: string

  delay?: number
  channel: {
    type: 'text' | 'dm'
    channelID?: string
  }
}

function isTargetOptions(obj: any): obj is TargetOptions {
  return typeof obj == 'object'
    && typeof obj.id == 'string'
    && typeof obj.authorID == 'string'
    && typeof obj.channel == 'object'
    && ['text', 'dm'].includes(obj.channel.type)
    && (obj.channel.type == 'text' ? typeof obj.channel.channelID == 'string' : true)
}

export class Tracker {
  private interval?: NodeJS.Timeout
  private initializer?: Promise<any>

  targetOptions: Record<string, TargetOptions[]>
  offWaiting: Map<string, Date>
  offNotified: Map<string, Date>

  constructor() {
    this.targetOptions = {}
    this.offWaiting = new Map()
    this.offNotified = new Map()
    this.initializer = this.init()
  }

  get ready() {
    return !this.initializer
  }

  async init() {
    console.log('[tracker] Initializing tracker...')
    const options = await settings.get('targets')

    for (const key in options) {
      if (!isTargetOptions(options)) {
        alert(`Invalid target options in database. ID: \`${key}\``)
        settings.delete('targets', key)
        continue
      }

      const target = await client.users.fetch(options.id),
        channel = options.channel.type == 'dm' ? await client.users.fetch(options.authorID) : await client.channels.fetch(options.channel.channelID).then(c => c.type == 'text' ? c : undefined)
      if (!target) {
        settings.delete('targets', key)
        if (canSendTo(channel)) channel.send(`Hi, I can't find your target with the following ID: \`${options.id}\`. Please check that I'm in at least one guild with the target and try to add it again: I'll stop tracking it for the moment.`)
      }
      if (!canSendTo(channel)) {
        settings.delete('targets', key)
      }

      this.targetOptions[options.id] = [
        ...(this.targetOptions[options.id] || []),
        options
      ]
    }

    console.log('[tracker] Tracker completely loaded.')
    this.initializer = undefined
  }

  async start() {
    if (!this.ready) await this.initializer

    this.interval = setInterval(async () => {
      // Check whether targets are online or not
      for (const targetID in this.targetOptions) {
        const user = await client.users.fetch(targetID)

        if (!user) {
          this.targetOptions[targetID].forEach(async (options) => {
            const channel = options.channel.type == 'dm' ? await client.users.fetch(options.authorID) : await client.channels.fetch(options.channel.channelID).then(c => c.type == 'text' ? c : undefined)

            settings.delete('targets', getDatabaseKey(options))
            if (canSendTo(channel)) channel.send(`Hi, I can't find your target with the following ID: \`${targetID}\`. Please check that I'm in at least one guild with the target and try to add it again: I'll stop tracking it for the moment.`)
          })
          delete this.targetOptions[targetID]
          continue
        }

        if (user.presence.status == 'offline' && !this.offWaiting.has(targetID))
          this.offWaiting.set(targetID, new Date())
        if (user.presence.status != 'offline' && this.offWaiting.has(targetID))
          this.offWaiting.delete(targetID)
      }

      // Check bots that have been found online
      this.offWaiting.forEach((date, id) => {
        const optionsArr = this.targetOptions[id]
        if (!optionsArr) return this.offWaiting.delete(id)

        optionsArr.forEach(options => {
          const delay = options.delay || 0
          if ((new Date()).getTime() - date.getTime() >= delay) {
            // START ACTIVE TRACKING 
          }
        })
      })

      // Do the same thing for bots that are offline and may have come back online
    }, 60 * 1000)

    return this.interval
  }

  stop() {
    clearInterval(this.interval)
    this.interval = undefined
  }
}

function getDatabaseKey(options: TargetOptions) {
  const { channel, authorID, id } = options

  return channel.type == 'text' ?
    id + channel.channelID :
    id + authorID
}
