require('dotenv').config()

import { Client, User } from 'discord.js'
import { readdirSync } from 'fs'
import { resolve as resolvePath } from 'path'
import { SettingsManager } from '../utils/settings'
import * as stats_poster from '../utils/stats_poster'

export let client: Client
export let owner: User
export let settings: SettingsManager

export const isDev = process.env.NODE_ENV == 'dev'
export const ownerID = '218308478580555777'
export const supportGuildID = '564148795433287732'

const deactivatePoster = true || isDev

function initClient() {
  client = new Client()

  client.on('error', console.error)
  client.on('warn', console.warn)
  client.on('debug', console.log)

  client.on('ready', async () => {
    owner = await client.users.fetch(ownerID)

    try {
      settings = new SettingsManager()
      await settings.init()
    } catch (e) {
      client.emit('error', e)
      owner?.send(`Error during client initialization:\n\`\`\`\n${e}\n\`\`\``, { split: true })
      process.exit(1)
    }

    // Starts the stat poster interval
    if (!deactivatePoster && stats_poster.available) try {
      await stats_poster.start()
    } catch (e) { console.error(e) }
    else client.emit('debug', deactivatePoster ? '[dbots] dbots not loaded.' : '[dbots] No optional DBL token found.')


    loadModules()
  })

  client.login(process.env.DISCORD_TOKEN)
}

initClient()

function loadModules() {
  client.emit('[modules] Loading modules...')
  const modulesDir = resolvePath(__dirname, '../modules')
  const files = readdirSync(modulesDir)
  for (const file of files) {
    require(resolvePath(modulesDir, file))
    client.emit('debug', `[modules] Loaded ${file} module.`)
  }
}

export function alert(msg: string) {
  const str = '[ALERT] ' + msg
  console.error(str)
  if (owner) owner.send(str)
}
