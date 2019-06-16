require('dotenv').config();
require('promise.prototype.finally').shim();

import * as Discord from 'discord.js'; // eslint-disable-line no-unused-vars
import * as Commando from 'discord.js-commando';
import * as sqlite from 'sqlite';
import * as path from 'path';
import * as fs from 'fs';

const { TOKEN } = process.env;

const refresh_ms = 5000;

export let client: Commando.CommandoClient;
export let homeguild: Discord.Guild;
export let owner: Discord.User;
export let roles: { [key: string]: Discord.Role } = {};
export let links: { [key: string]: string } = {};

import * as backup from './backup';
import { Target, TargetLike, TargetList, TargetListModel } from '../custom/types'; // eslint-disable-line no-unused-vars

/**
 * Creates the client, sets event handlers, registers groups and commands, sets the provider, loads APIs 
 */
async function initClient() {
  let ready = false;
  client = new Commando.CommandoClient({
    owner: '218308478580555777',
    //@ts-ignore
    unknownCommandResponse: false
  });

  client.on('error', console.error);
  client.on('warn', console.warn);
  client.on('debug', console.log);

  client.on('ready', () => {
    ready = true;
    homeguild = client.guilds.get('564148795433287732');
    owner = homeguild.members.get('218308478580555777').user;
    roles = {
      dev: homeguild.roles.get('498225931299848193')
    };
    links = {
      invite: `<https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=93248>`,
      support: 'https://discord.gg/fVJMDJg'
    };
  });

  client.registry.registerGroups([
    ['bot', 'Bot'],
    ['data', 'Data management'],
    ['dbl', 'Discord Bots List'],
    ['dev', 'Developers'],
    ['um', 'Uptime Monitor']
  ]).registerDefaultGroups()
    .registerDefaultTypes()
    .registerDefaultCommands({
      ping: false,
      unknownCommand: false
    });

  client.login(TOKEN);

  await client.setProvider(
    sqlite.open(path.join(__dirname, '../../data/settings.sqlite3')).then(db => new Commando.SQLiteProvider(db))
  ).catch(console.error);

  if (ready) loadList();
  else client.on('ready', loadList);

  // Starts the interval
  if (process.env.DBL_TOKEN) (await import('../utils/dbl_stats')).post().catch(console.error);
  else console.log('No optional DBL token found.');

  client.registry.registerCommandsIn({
    dirname: path.join(__dirname, '../commands'),
    filter: /(.+)\.ts$/,
    excludeDirs: /^\.(git|svn)|samples$/,
    recursive: true
  });

  return client;
}

/**
 * Sends an error to the owner in a standard-format way.
 * @param from The file/method from which the error is being reported.
 * @param error The actual error object or a custom string.
 */
export function error(from: string, error: string | Error) {
  return owner.send(`Unexpected error from \`${from || 'unknown'}\`:\n\`\`\`\n${error || 'none'}\n\`\`\``);
}

// #region Modules

const custom_modules = ['automation'];
/**
 * Loads every module group from the `custom_modules` array 
 */
function loadModules() {
  for (const groupName of custom_modules) {
    const groupDirectory = path.join(__dirname, '..', groupName);
    const files = fs.readdirSync(groupDirectory);
    for (const file of files) {
      require(path.join(groupDirectory, file));
      loader(`${groupName}/${file}`);
    }
  }
}

/**
 * Logs a load statement
 * @param name 
 */
export function loader(name: string) {
  console.log(`[LOADER] Loaded '${name}'`);
}

// #endregion

(async () => {
  if (backup.available) await backup.init().catch(console.error);
  else console.log('No backup token found.');
  await initClient();
  loadModules();
})().catch(console.error);

export const targets: TargetList = {};

/**
 * Adds a target to both the 'live' list and the settings file, so that it can be restored later. The target is automatically started after it's added to the 'live' list.
 * @param structure The structure to build the tag from.
 * @param write Whether to write the target in the settings file; set this to `false` only when loading back the targets from the list itself.
 */
export async function addTarget(structure: TargetLike, write = true) {
  const [name, targetID, timeout, authorID, send_to] = structure;

  const target = new Target(name, targetID, timeout, authorID, send_to),
    previous = targets[authorID];
  target.startWatching(refresh_ms);

  if (previous) targets[authorID] = [...previous, target];
  else targets[authorID] = [target];

  if (write) {
    const currentList: TargetListModel = client.provider.get('global', 'targetList', {});
    if (currentList && currentList[authorID]) currentList[authorID].push(structure);
    else currentList[authorID] = [structure];
    await client.provider.set('global', 'targetList', currentList);
  }
}

/**
 * Removes a target from both the 'live' list and the settings file. The target is automatically stopped as soon as the function is called.
 * @param target The target to remove.
 */
export async function removeTarget(target: Target) {
  target.stop();

  const { id, issuer, send_to } = target;
  if (targets[issuer]) {
    for (let i = 0; i < targets[issuer].length; i++) {
      const curr = targets[issuer][i];
      if (curr.id == id && curr.send_to == send_to) {
        targets[issuer].splice(i, 1);
        if (targets[issuer].length == 0) delete target[issuer];
        break;
      }
    }
  }

  const currentList: TargetListModel = client.provider.get('global', 'targetList', {});
  if (currentList && currentList[issuer]) {
    for (let i = 0; i < currentList[issuer].length; i++) {
      const curr = currentList[issuer][i];
      if (curr[1] == id && curr[4] == send_to) {
        currentList[issuer].splice(i, 1);
        if (currentList[issuer].length == 0) delete currentList[issuer];
        break;
      }
    }
  }
  await client.provider.set('global', 'targetList', currentList);
}

/**
 * Finds a target in the 'live' list.
 * @param target_id The Discord ID of the target.
 * @param issuer_id The Discord ID of the user that submitted the target.
 */
export function findTarget(target_id: string, issuer_id: string) {
  const section = targets[issuer_id];
  if (section)
    for (const curr of section)
      if (curr.id == target_id) return curr;
}

/**
 * Loads the targets found in the settings file.
 */
async function loadList() {
  console.log('Loading targets from existing list...');
  const currentList: TargetListModel = client.provider.get('global', 'targetList', {});
  const nextList = currentList;
  let addedTargets = 0,
    removedTargets = 0,
    removedIssuers = 0;

  for (const issuerID in currentList) {
    const issuer = await client.fetchUser(issuerID);
    if (!issuer) {
      delete nextList[issuerID];
      removedIssuers++;
    } else {
      let deletedItems = 0;
      for (let i = 0; i < currentList[issuerID].length; i++) {
        const current = currentList[issuerID][i];
        const target = await client.fetchUser(current[1]);
        if (target) {
          addTarget(current, false);
          addedTargets++;
        } else {
          nextList[issuerID].splice(i - deletedItems, 1);
          deletedItems++;
          removedTargets++;
        }
      }
    }
  }

  client.provider.set('global', 'targetList', nextList);

  console.log(`Loaded ${addedTargets} target${addedTargets != 1 ? 's' : ''}, removed ${removedTargets} unreachable target${removedTargets != 1 ? 's' : ''} and removed ${removedIssuers} unreachable issuer${addedTargets != 1 ? 's\'' : '\'s'} targets.`);
}