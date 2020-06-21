import { User, GuildMember } from 'discord.js'
import { ownerID, settings, client, supportGuildID } from '../core/app'

// #region Functions

/** Returns str with capital first letter */
export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/** 
 * Enforces a type by returning always `true`; you need to use this with a type guard 
 * @example if (!enforceType<YourType>(parameter)) return;
 */
export function enforceType<T>(_parameter: any): _parameter is T {
  return true
}

/** Gets the command prefix for a guild or, if none is provided, the default one. */
export async function getCommandPrefix(guildID?: string) {
  return String(
    await (
      guildID
        ? settings.get('prefix', guildID)
        : settings.get('bot', 'defaultPrefix')
    )
  )
}

/** Returns the link to use to add the bot to other guilds */
export function getInviteLink() {
  return `https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=0`
}

/** Gets the link to the support guild either from the settings or by creating a new one */
export async function getSupportLink() {
  const fromSettings = await settings.get('bot', 'supportInvite')

  if (fromSettings)
    return fromSettings
  else {
    const invite = await client.guilds.cache.get(supportGuildID)
      ?.channels.cache.find(({ name }) => name == 'readme')
      ?.createInvite({
        maxAge: 0,
        reason: 'Couldn\'t find existing invite, settings have been updated.'
      })

    if (invite) {
      settings.set('bot', 'supportInvite', invite.url)
      return invite.url
    }
  }
}

/** Checks whether a string is a Discord mention */
export function isMention(str: string) {
  return (typeof str == 'string' && str.startsWith('<@') && str.endsWith('>'))
}

/** Returns whether the user is the bot owner */
export function isOwner(user: User | GuildMember | string) {
  return (typeof user == 'string' ? user : user.id) == ownerID
}

/** Converts a Discord mention into a string */
export function mentionToID(str: string) {
  return str.replace(/[\\<>@#&!]/g, '')
}

/** Creates an array from the given string literals. The array has a specific union type based on the elements. */
export function stringArray<T extends string>(...args: T[]): T[] { return args }

// #endregion

// #region Types

export type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer ElementType> ? ElementType : never;

export type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T;
};

// #endregion
