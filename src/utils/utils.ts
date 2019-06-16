import { homeguild, owner } from '../core/app';
import { User, TextChannel, Channel } from 'discord.js'; // eslint-disable-line no-unused-vars

/**
 * Gets an invite to the support guild
 * @param codeOnly Whether to return only the code of the invite instead of the URL (default is `false`)
 */
export async function getSupportInvite(codeOnly = false) {
  const readme = homeguild.channels.get('505805487166586901') || homeguild.channels.find(c => c.name == 'readme');
  if (!readme) {
    owner.send('Can\'t find \'readme\' channel, please check the ID.');
    return;
  }
  const invite = await readme.createInvite({ maxAge: 0 });
  return codeOnly ? invite.code : `https://discord.gg/${invite.code}`;
}

/**
 * Type guard for a text channel.
 * @param c The element you want to check.
 */
export function isTextChannel(c: any): c is TextChannel {
  return (c instanceof Channel && c.type == 'text');
}

/**
 * Returns a user in a 'loggable' format.
 * @param user The user or its ID.
 */
export function longName(user: User) {
  return `${user.tag} (${user.id})`;
}

/**
 * Returns the current Date.
 */
export function now() {
  return new Date();
}