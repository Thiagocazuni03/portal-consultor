import Datasheet from '../system/Datasheet.js'
import ItemDatabase from '../system/ItemDatabase.js'
import PriceList from '../system/PriceList.js'
import PopUp from './PopUp.js'
import $ from 'jquery'

export default class Session {

   static CONFIG_KEY = 'SESSION'

   static set(key, value) {
      const pastConfig = Session.#getConfig()
      const newConfig = { ...pastConfig, [key]: value }
      Session.#ovewrite(newConfig)
   }

   static get(key) {
      return Session.#getConfig()[key]
   }

   static delete(key) {
      const curConfig = Session.#getConfig()
      delete curConfig[key]
      Session.#ovewrite(curConfig)
   }

   static setDefaultSettings() {
      this.#getDefaultSettings().forEach(({ key, value }) => {
         const hasKey = this.get(key) !== undefined
         if (hasKey) return
         this.set(key, value)
      })
   }

   static updateTheme() {
      const isThemeDark = Session.#getConfig()['isThemeDark']
      const targetToSetClass = document.querySelector('html')
      targetToSetClass.className = isThemeDark ? 'dark' : 'light'
   }

   static #ovewrite(newConfig) {
      const stringedConfig = JSON.stringify(newConfig)
      localStorage.setItem(Session.CONFIG_KEY, stringedConfig)
   }

   static #getConfig() {
      const storedConfig = localStorage.getItem(Session.CONFIG_KEY)
      const parsedConfig = storedConfig ? JSON.parse(storedConfig) : {}
      return parsedConfig
   }

   static getLanguage(){
      return this.#getConfig()['language'] ?? 'pt'
   }

   static clearCache() {
      PriceList.clearCache()
      Datasheet.clearCache()
      ItemDatabase.clearDatabase()
      PopUp.triggerSuccess('Cache limpo com sucesso.', null, 'CACHE_CLEAR_POPUP')
   }

   static #getDefaultSettings() {
      return [
         {
            key: 'useMoneyViewerAuto',
            value: true
         }
      ]
   }
}

