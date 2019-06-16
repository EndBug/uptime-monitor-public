// eslint-disable-next-line no-unused-vars
import { Message, User, RichEmbed, ColorResolvable } from 'discord.js';
import { client, removeTarget } from '../core/app';
import { now, longName, isTextChannel } from '../utils/utils';

export interface TargetLike extends Array<any> {
  /**
   * A codename that will help recognize the target (only for debugging purposes).
   */
  0: string

  /**
   * The ID of the target. Make sure the target is connected to the bot through at least one guild.
   */
  1: string

  /**
   * The number of minutes the target has to be offline before the bot notifies you.
   */
  2: number

  /**
   * The id of the user that asked to track this target.
   */
  3: string

  /**
   * The channel to send notifications to (if not specified they get sent to the issuer).
   */
  4?: string

  length: 5
}

/**
 * Class for every accepted target.
 */
export class Target {
  // #region Properties

  /**
  * A codename that identifies the target (only for debugging purposes).
  */
  name: string

  /**
   * The Discord ID of the target.
   */
  id: string

  /**
   * The number of minutes to wait before sending the notification.
   */
  timeout: number

  /**
   * The currrently active interval (both 'watch' and 'alert' intervals get stored here).
   */
  interval?: NodeJS.Timeout

  /**
   * The date of when the target has been found offline.
   */
  offlineSince?: Date

  /**
   * The last notification message sent by the bot for this target.
   */
  lastMessage?: Message

  /**
   * The last user object found for the target.
   */
  cachedUser?: User

  /**
   * The id of the user that asked to track this target.
   */
  issuer: string

  /**
   * The `guildID/channelID` of the channel to send notifications to (by default they get sent to the issuer).
   */
  send_to?: string

  // #endregion

  /**
   * @param name A codename that will help recognize the target (only for debugging purposes).
   * @param id The ID of the target. Make sure the target is connected to the bot through at least one guild.
   * @param timeout The number of minutes the target has to be offline before the bot notifies you.
   * @param issuer The id of the user that asked to track this target.
   * @param send_to The channel to send notifications to in the `guildID/channelID` format.
   */
  constructor(name: string, id: string, timeout: number, issuer: string, send_to?: string) {
    this.name = name;
    this.id = id;
    this.timeout = timeout;
    this.issuer = issuer;
    this.send_to = send_to;
  }

  /**
   * Sends a message to the notifications channel; if none is detected, it passes the message to the issuer.
   * @param args The same args as `TextChannel.send()` or `User.send()`.
   */
  async send(...args) {
    if (this.send_to) {
      const splitted = this.send_to.split('/');
      const [guildID, channelID] = splitted;
      const guild = client.guilds.get(guildID);
      if (!guild) {
        const userExists = !!(await this.sendIssuer(`The previous notification channel you set for ${this.display()} has become unreachable (identifier: ${this.send_to}). From now on, notifications for this target will be sent here.`));
        this.send_to = undefined;
        if (userExists) return this.sendIssuer(...args);
        else {
          console.log(`Issuer for target ${this.display()} is unreachable, removing target.`);
          removeTarget(this);
        }
      } else {
        const channel = guild.channels.get(channelID);
        if (!isTextChannel(channel)) {
          // same as above.
          const userExists = !!(await this.sendIssuer(`The previous notification channel you set for ${this.display()} has become unreachable (identifier: ${this.send_to}). From now on, notifications for this target will be sent here.`));
          this.send_to = undefined;
          if (userExists) return this.sendIssuer(...args);
          else {
            console.log(`Issuer for target ${this.display()} is unreachable, removing target.`);
            removeTarget(this);
          }
        } else return channel.send(...args);
      }
    } else {
      const sent = await this.sendIssuer(...args);
      if (sent) return sent;
      else {
        console.log(`Issuer for target ${this.display()} is unreachable, removing target.`);
        removeTarget(this);
      }
    }
  }

  /**
   * Creates an embed for an 'uptime' message.
   * @param msg The string you want to send.
   * @param color The color you want the embed to have.
   * @param send Whether to directly send the embed or just return it.
   */
  async uptimeEmbed(msg: string, color: ColorResolvable, send = false) {
    const embed = new RichEmbed()
      .setDescription(msg)
      .setColor(color);

    const issuer = await client.fetchUser(this.issuer);
    if (!issuer) {
      console.log(`Issuer for target ${this.display()} is unreachable, removing target.`);
      removeTarget(this);
    } else {
      embed.setFooter(`Tracked by ${issuer.tag}`, issuer.displayAvatarURL);
      if (send) return await this.send(embed);
      else return embed;
    }
  }

  /**
   * Sends a message to the issuer.
   * @param args The same args as `User.send()`.
   */
  async sendIssuer(...args) {
    const user = await client.fetchUser(this.issuer);
    if (user) return user.send(...args);
  }

  /**
   * Starts watching for the target to go offline.
   * @param refresh_ms The number of ms to run the cycle with.
   */
  startWatching(refresh_ms: number) {
    this.stop();
    const watch = async () => {
      const isOnline = await this.check();
      if (isOnline === false) {
        this.offlineSince = now();
        this.startAlert(refresh_ms);
        console.log((this.longName() || `${this.name} (${this.id})`) + 'has been found offline, timer started.');
      }
    };
    this.interval = setInterval(watch, refresh_ms);
    watch();
  }

  /**
   * Starts watching when the bot is found offline: after some time, it'll send the notification message and it'll edit it when the target comes back online.
   * @param refresh_ms The number of ms to run the cycle with.
   */
  startAlert(refresh_ms: number) {
    this.stop();
    const alert = async () => {
      const isOnline = await this.check();
      const isOut = (+(now()) - +(this.offlineSince)) > this.timeout * 60000;
      if (isOnline === true) {
        if (this.offlineSince && isOut) {
          const str = `:white_check_mark: \`${this.display()}\` is now back online!`;
          if (this.lastMessage) this.lastMessage.edit(await this.uptimeEmbed(str, 'GREEN')).catch(() => this.uptimeEmbed(str, 'GREEN', true));
          else this.uptimeEmbed(str, 'GREEN', true);
          this.lastMessage = undefined;
        }
        this.offlineSince = undefined;
        this.startWatching(refresh_ms);
        console.log((this.longName() || `${this.name} (${this.id})`) + 'has come back online, alert canceled.');
      } else if (isOnline === false) {
        if (!this.offlineSince) this.offlineSince = now();
        if (isOut) {
          if (!this.lastMessage) {
            let message = await this.uptimeEmbed(`:red_circle: \`${this.display()}\` has been offline for \`${this.getDowntime()}\` minutes.`, 'RED', true);
            if (message instanceof Array) message = message[0];
            if (message instanceof Message) this.lastMessage = message;
          } else if (this.lastMessage) {
            const str = `:red_circle: \`${this.display()}\` has been offline for \`${this.getDowntime()}\` minutes.`;
            if (str != this.lastMessage.embeds[0].description) {
              let msg = await this.lastMessage.edit(await this.uptimeEmbed(str, 'RED')).catch(() => this.uptimeEmbed(str, 'RED', true));
              if (msg instanceof Array) msg = msg[0];
              if (msg instanceof Message) this.lastMessage = msg;
            }
          }
        }
        // console.log((this.longName() || `${this.name} (${this.id})`) + ' has ecceeded maximum time, notification sent.');
      }
    };
    this.interval = setInterval(alert, refresh_ms);
    alert();
  }

  /**
   * Clears the current interval.
   */
  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  /**
   * Returns whether the target is online; if the target is unreachable it stop monitoring it.
   */
  async check() {
    const user = await client.fetchUser(this.id);
    if (user) {
      this.cachedUser = user;
      const { status } = user.presence;
      if (status == 'offline') return false;
      else return true;
    } else {
      this.stop();
      const error = `Target '${this.name} (id: ${this.id}) has become unreachable: I've stopped watching it.`;
      this.send(error);
      client.emit('error', error);
      removeTarget(this);
    }
  }

  /**
   * Returns a displayable name for the target.
   */
  display() {
    return this.cachedUser ? longName(this.cachedUser) : this.name;
  }

  /**
   * Returns the rounded number of minutes the target has been offline.
   */
  getDowntime() {
    return Math.round((+(now()) - +(this.offlineSince || now())) / 60000);
  }

  /**
   * Returns the displayable long name of the last cached user for the target.
   */
  longName() {
    return this.cachedUser ? longName(this.cachedUser) : undefined;
  }
}

/**
 * The interface for the target list object, with the issuer ID as key and the array of watched targets as value.
 */
export interface TargetList {
  [x: string]: Target[]
}

/**
 * The interface for the target list to be stored in the settings database, with the issuer ID as key and the array of watched targets as value.
 */
export interface TargetListModel {
  [x: string]: TargetLike[]
}
