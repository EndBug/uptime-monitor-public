/* eslint-disable no-dupe-class-members */
import { stringArray, ElementType } from './utils'
import Database, { DBValue } from 'gsheet-database'

const sheetNames = stringArray('bot', 'prefix', 'targets')
type sheetName = ElementType<typeof sheetNames>

const { GOOGLE_API_CREDS, GOOGLE_STORAGE_ID } = process.env

export class SettingsManager {
  private db: Database

  constructor() {
    this.db = new Database({
      sheetID: GOOGLE_STORAGE_ID,
      auth: JSON.parse(GOOGLE_API_CREDS)
    })
  }

  get isReady() {
    return this.db.isReady
  }

  get(table: sheetName): Promise<Record<string, DBValue>>
  get(table: sheetName, key: string): Promise<DBValue>
  get(table: sheetName, key?: string) {
    return this.db.get(table, key)
  }

  set(table: sheetName, key: string, value: DBValue) {
    return this.db.set(table, key, value)
  }

  delete(table: sheetName, key: string) {
    return this.db.delete(table, key)
  }
}
