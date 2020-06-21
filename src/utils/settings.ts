/* eslint-disable no-dupe-class-members */
import { default as gsheetdb, Row } from 'gsheetdb'
import { stringArray, ElementType, PartialRecord } from './utils'
import { client } from '../core/app'

const sheetNames = stringArray('bot', 'prefix', 'targets')

type sheetName = ElementType<typeof sheetNames>
type settingsValue = ElementType<Row>
type settingsSheet = Record<string, settingsValue>

const { GOOGLE_API_CREDS, GOOGLE_STORAGE_ID } = process.env

export class SettingsManager {
  private initializer?: Promise<void>
  private settings: PartialRecord<sheetName, settingsSheet>
  private sheets: PartialRecord<sheetName, gsheetdb>

  constructor() {
    this.sheets = {}
    this.settings = {}
    this.initializer = this.init()
  }

  get ready() {
    return !this.initializer
  }

  async init(force = false) {
    if (this.ready || force) {
      client.emit('debug', '[settings] Loading settings...')
      for (const name of sheetNames) {
        const sheet = new gsheetdb({
          credentialsJSON: JSON.parse(GOOGLE_API_CREDS),
          sheetName: name,
          spreadsheetId: GOOGLE_STORAGE_ID
        })
        this.sheets[name] = sheet
        this.settings[name] = await fetchSettings(sheet)
      }
      client.emit('debug', '[settings] Settings loaded successfully.')
    } else return this.initializer
  }

  async get(sheet: sheetName): Promise<settingsSheet>
  async get(sheet: sheetName, key: string): Promise<settingsValue>
  async get(sheet: sheetName, key?: string) {
    if (!sheetNames.includes(sheet)) throw new TypeError(`Provided key is not a settings key. (Received: '${sheet}'`)

    if (!this.ready) await this.initializer

    return key ? this.settings[sheet][key] : this.settings[sheet]
  }

  async set(sheet: sheetName, key: string, value: settingsValue) {
    if (!sheetNames.includes(sheet)) throw new TypeError(`Provided key is not a settings key. (Received: '${sheet}'`)

    if (!this.ready) await this.initializer

    const gSheet = this.sheets[sheet],
      existingIndex = (await gSheet.getData())?.find(entry => entry.values[0] == key)?.rowNb,
      futureRow = [key, value]

    this.settings[sheet][key] = value

    return existingIndex
      ? gSheet.updateRow(existingIndex, futureRow)
      : gSheet.insertRows([futureRow])
  }
}

/**
 * Gets the settings from a Sheet. Returns an object
 * @param sheet The sheet to extract properties from
 */
async function fetchSettings(sheet: gsheetdb): Promise<settingsSheet> {
  const rawData = await sheet.getData()

  const result: Record<string, settingsValue> = {}

  for (const { values } of rawData) {
    const [key, value] = values
    result[String(key)] = value
  }

  return result
}
