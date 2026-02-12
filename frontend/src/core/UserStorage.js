import { STORAGE_URL, EVENT_URL, BRAND, APPLICATION } from '../api/Variables.js'
import ItemDatabase from '../system/ItemDatabase.js'

export default class UserStorage {

   static #COOKIE_KEY = null
   static #STORAGE_KEY = null
   static #STORAGE_PASS = null
   static #UNIQUE_KEY = null
   static #STORAGE = null
   static #TRASH_LENGTH = 15

   static async initSession() {
      UserStorage.#detectStorage()
      await UserStorage.#getUniqueKey()
      await UserStorage.#registerBaseKeys()
      ItemDatabase.setupDataBase()
      UserStorage.logAllKeys('---INICIALIZANDO')
   }

   static #detectStorage(){
      const sessionLength = sessionStorage.length
      const localLength = localStorage.length
      const isDataInSessionStorage = sessionLength > localLength

      UserStorage.#STORAGE = isDataInSessionStorage ? sessionStorage : localStorage
   }

   static logAllKeys(label) {
      console.log(
         `${label}\n`,
         'Storage: ' + (this.#STORAGE === sessionStorage ? 'Session' : 'Local') + '\n',
         'StorageKey: ' + this.#STORAGE_KEY + '\n',
         'StoragePass: ' + this.#STORAGE_PASS + '\n',
         'Cookie: ' + this.#COOKIE_KEY + '\n',
         'UniqueKey: ' + this.#UNIQUE_KEY + '\n',
      )
   }

   static isSessionOkay() {      
      const isCookiesOkay = document.cookie.split('; ').length >= UserStorage.#TRASH_LENGTH
      const isSessionStorageOK = sessionStorage.length >= UserStorage.#TRASH_LENGTH 
      const isLocalStorageOK = localStorage.length >= UserStorage.#TRASH_LENGTH
      const isUserSessionOK = isCookiesOkay && (isSessionStorageOK || isLocalStorageOK)

      return isUserSessionOK
   }

   static logoutSession(){
      UserStorage.#clearAllKeys()
      UserStorage.clearAllStorage()
      ItemDatabase.clearDatabase()

      window.location.href = './index.html'
   }

   static #clearAllKeys(){
      UserStorage.#COOKIE_KEY = null
      UserStorage.#STORAGE_KEY = null
      UserStorage.#STORAGE_PASS = null
      UserStorage.#UNIQUE_KEY = null
      UserStorage.#STORAGE = null
   }

   static async registerSession(shouldRememberUser) {
      UserStorage.clearAllStorage()
      UserStorage.#chooseStorage(shouldRememberUser)
      await UserStorage.#registerUniqueKey()
      await UserStorage.#registerBaseKeys()
      UserStorage.#registerCryptCookie()
      UserStorage.logAllKeys('---REGISTRANDO')
   }

   static async rebuildSession(){
      await UserStorage.#regenerateSellerJSON()
      await UserStorage.#fetchStorageAgain()
   }

   static async isUserSimulator(){
      return Number(await UserStorage.getSellerPerms('simulator')) === 1
   }

   static async isUserManager(){
      return Number(await UserStorage.getSellerInfo('type')) === 2
   }

   static async #chooseStorage(shouldRememberUser){
      shouldRememberUser
         ? UserStorage.#STORAGE = localStorage
         : UserStorage.#STORAGE = sessionStorage
   }

   static async #regenerateSellerJSON(){
      const updateSellerParams = await UserStorage.#getSellerUpdateParams()
      await fetch(EVENT_URL, updateSellerParams).then(res => res.json())

      const updateMemberParams = await UserStorage.#getMemberUpdateParams()
      await fetch(EVENT_URL, updateMemberParams).then(res => res.json())
   }

   static async #getSellerUpdateParams() {
      const sellerID = await UserStorage.getSellerInfo('identifier')
      const lowerCasedID = sellerID.toLowerCase()

      return {
         method: 'POST',
         timeout: 0,
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            'type': 'file',
            'module': 13022,
            'path': 'ws/account/',
            'fileName': lowerCasedID,
            'extension': 'json',
            'params': { 'sellerID': sellerID },
            'application': APPLICATION
         })
      }
   }

   static async #getMemberUpdateParams() {
      const memberID = await UserStorage.getMemberInfo('identifier')
      const lowerCasedID = memberID.toLowerCase()  

      return {
         method: 'POST',
         timeout: 0,
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            'type': 'file',
            'module': 13020,
            'path': 'ws/member/',
            'fileName': lowerCasedID,
            'extension': 'json',
            'params': { 'memberID': memberID },
            'application': APPLICATION
         })
      }
   }

   static async #fetchStorageAgain(){
      const memberStorage = await UserStorage.#fetchMemberAgain()
      const sellerStorage = await UserStorage.#fetchSellerAgain()
      const keyInfo = await UserStorage.#getAllKeyInfo()

      await UserStorage.reInitSession()
      await UserStorage.storeData({
         keyInfo,
         ...sellerStorage,
         ...memberStorage
      })
   }

   static async reInitSession(){ 
      const Session = localStorage.getItem('SESSION')

      UserStorage.clearAllStorage()

      await UserStorage.#registerUniqueKey()
      await UserStorage.#registerBaseKeys()

      localStorage.setItem('SESSION', Session)

      this.logAllKeys('--REINICIALIZANDO')
   }

   static async #fetchMemberAgain(){
      const memberID = await UserStorage.getMemberInfo('identifier')
      const finalUrl = STORAGE_URL + 'ws/member/' + memberID.toLowerCase() + '.json' + `?t=${new Date().getTime()}`
      const storageRequest = await fetch(finalUrl, { cache: 'no-store' })
      const requestJSON = await storageRequest.json()

      return {
         memberInfo: requestJSON.member.info,
         memberPoints: requestJSON.member.points,
      }
   }

   static async #fetchSellerAgain(){
      const sellerID = await UserStorage.getSellerInfo('identifier')
      const finalUrl = STORAGE_URL + 'ws/account/' + sellerID.toLowerCase() + '.json' + `?t=${new Date().getTime()}`
      const storageRequest = await fetch(finalUrl, { cache: 'no-store' })
      const requestJSON = await storageRequest.json()

      return {
         sellerInfo: requestJSON.seller.info,
         sellerPerms: requestJSON.seller.permissions,
      }
   }
   
   static async #getUniqueKey(){
      UserStorage.#UNIQUE_KEY = UserStorage.#STORAGE.getItem(await UserStorage.#getStaticHash())
   }

   static async #registerBaseKeys(){
      UserStorage.#COOKIE_KEY = await UserStorage.#createHash(this.#getWeekNumber() + UserStorage.#UNIQUE_KEY + 'Allinsys')
      UserStorage.#STORAGE_KEY = await UserStorage.#createHash(this.#getWeekNumber() + UserStorage.#UNIQUE_KEY + BRAND)
      UserStorage.#STORAGE_PASS = await UserStorage.#createHash(this.#getWeekNumber() + UserStorage.#UNIQUE_KEY + 'Storage')
   }

   static async #getStaticHash() {
      const KEY = UserStorage.#getWeekNumber() + BRAND
      return await UserStorage.#createHash(KEY)
   }

   static async #registerUniqueKey(){
      const STATIC_KEY = await UserStorage.#getStaticHash()
      const UNIQUE_UUID = crypto.randomUUID()
      const UUID_HASH = await UserStorage.#createHash(UNIQUE_UUID)

      UserStorage.#UNIQUE_KEY = UUID_HASH
      UserStorage.#STORAGE.setItem(STATIC_KEY, UUID_HASH)
   }

   static async storeData(sessionData){
      const stringedStorage = JSON.stringify(sessionData)
      const encryptedData = await UserStorage.aesCGMEncrypt(stringedStorage, UserStorage.#STORAGE_PASS)

      UserStorage.#STORAGE.setItem(UserStorage.#STORAGE_KEY, encryptedData)
      UserStorage.#storeGarbage()
   }

   static async #getAllKeyInfo(){
      return await UserStorage.aesCGMDecrypt(

         UserStorage.#STORAGE.getItem(UserStorage.#STORAGE_KEY),
         UserStorage.#STORAGE_PASS

      )
      .then(data => JSON.parse(data))
      .then(info => info['keyInfo'])
   }

   /**
    * APENAS PARA VISUALIZAÇÃO DOS DADOS
    * REMOVER QUANDO POSSíVEL
    */
   static async getAllInfo(path){
      return await UserStorage.aesCGMDecrypt(

         UserStorage.#STORAGE.getItem(UserStorage.#STORAGE_KEY),
         UserStorage.#STORAGE_PASS

      )
      .then(data => JSON.parse(data))
   }

   static async getKeyInfo(key) {
      if (key === undefined) throw new Error('A função precisa de uma chave.')
      return await UserStorage.#getInfo('keyInfo', key)
   }

   static async getSellerInfo(key) {
      if (key === undefined) throw new Error('A função precisa de uma chave.')
      return await UserStorage.#getInfo('sellerInfo', key)
   }

   static async getSellerPerms(key) {
      if (key === undefined) throw new Error('A função precisa de uma chave.')
      return await UserStorage.#getInfo('sellerPerms', key)
   }

   static async getMemberInfo(key) {
      if (key === undefined) throw new Error('A função precisa de uma chave.')
      return await UserStorage.#getInfo('memberInfo', key)
   }

   static async getMemberPoints(key) {
      if (key === undefined) throw new Error('A função precisa de uma chave.')
      return await UserStorage.#getInfo('memberPoints', key)
   }

   static async #getInfo(path, key) {
      return await UserStorage.aesCGMDecrypt(

         UserStorage.#STORAGE.getItem(UserStorage.#STORAGE_KEY),
         UserStorage.#STORAGE_PASS

      )
      .then(data => JSON.parse(data))
      .then(json => json[path])
      .then(info => info[key])
   }

   static #registerCryptCookie() {
      UserStorage.#registerCookie({
         key: UserStorage.#COOKIE_KEY,
         value: UserStorage.#STORAGE_PASS,
         expires: UserStorage.#getTommorowUTCDate(),
         sameSite: 'strict',
         secure: true,
      })
   }

   static #getWeekNumber() {
      const currentDate = new Date()
      const startDate = new Date(currentDate.getFullYear(), 0, 1)
      const daysAmount = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24))
      const weekNumber = Math.ceil(daysAmount / 7)

      return weekNumber
   }

   static #getTommorowUTCDate() {
      const tomorrowDate = new Date()
      tomorrowDate.setDate(tomorrowDate.getDate() + 1)
      return tomorrowDate.toUTCString()
   }

   static #registerCookie({ key, value, expires, sameSite, secure }) {
      document.cookie = `${key}=${value}; expires=${expires}; path=/; sameSite=${sameSite}; secure=${secure};`
   }

   static clearAllStorage() {
      UserStorage.#clearAllCookies()
      sessionStorage.clear()
      localStorage.clear()
   }

   static async aesCGMEncrypt(string, password) {

      //Codificando a chave como HASH
      const keyEncoded = new TextEncoder().encode(password)
      const keyHashed = await crypto.subtle.digest('SHA-256', keyEncoded)

      //Criando o vetor de inicialização
      const initVector = crypto.getRandomValues(new Uint8Array(12))
      const initVectorStr = Array.from(initVector).map(b => String.fromCharCode(b)).join('')

      //Objecto de configuração algorítmo (IV necessário)
      const algorithm = { name: 'AES-GCM', iv: initVector }

      //Criando a chave que criptografará os dados
      const encryptKey = await crypto.subtle.importKey('raw', keyHashed, algorithm, false, ['encrypt'])

      //Criando nosso "CypherText", retornando IV + CypherStr
      const textEncoded = new TextEncoder().encode(string)
      const cypherTextBuffer = await crypto.subtle.encrypt(algorithm, encryptKey, textEncoded)
      const cypherTextArr = Array.from(new Uint8Array(cypherTextBuffer))
      const cypherTextStr = cypherTextArr.map(byte => String.fromCharCode(byte)).join('')

      return window.btoa(initVectorStr + cypherTextStr)
   }

   static async aesCGMDecrypt(cypherText, password) {

      //Codificando a chave como Hash
      const passEncoded = new TextEncoder().encode(password)
      const passHash = await crypto.subtle.digest('SHA-256', passEncoded)

      //Criando o vetor de inicialização
      const initVectorStr = window.atob(cypherText).slice(0, 12)
      const initVector = new Uint8Array(Array.from(initVectorStr).map(ch => ch.charCodeAt(0)))

      //Objecto de configuração algorítmo (IV necessário)
      const algorithm = { name: 'AES-GCM', iv: initVector }

      //Criando a chave que descriptografará os dados
      const descryptKey = await crypto.subtle.importKey('raw', passHash, algorithm, false, ['decrypt'])

      //Decodificando e transformando o cypherText
      const cypherTextStr = window.atob(cypherText).slice(12)
      const cypherTextUint8 = new Uint8Array(Array.from(cypherTextStr).map(ch => ch.charCodeAt(0)))

      //Try catch necessário em casos de senha errada
      try {

         //Decryptando os dados
         const plainBuffer = await crypto.subtle.decrypt(algorithm, descryptKey, cypherTextUint8)

         //Decodificando a string para valor original
         const plainText = new TextDecoder().decode(plainBuffer)

         //Retornando
         return plainText

      } catch (e) {
         throw new Error('Decrypt failed')
      }
   }

   static #clearAllCookies() {
      const storedCookies = UserStorage.#getCookiesObject()
      const cookieKeys = Object.keys(storedCookies)

      cookieKeys.forEach(key => {
         document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })
   }

   static #getCookiesObject() {
      const allCookies = document.cookie
      const cookieArr = allCookies.split('; ')
      const keyValueArr = cookieArr.map(cookie => cookie.split('='))
      const keyValueWithNull = keyValueArr.map(([key, value]) => [key, value ? value : null])
      const cookiesObject = Object.fromEntries(keyValueWithNull)

      return cookiesObject
   }

   static async #createHash(string) {
      const strUint8 = new TextEncoder().encode(string)
      const hashBuffer = await crypto.subtle.digest('SHA-256', strUint8)
      const hashArr = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArr.map((b) => b.toString(16).padStart(2, '0')).join('')
      
      return hashHex
   }

   static #generateTrashStr(stringLength) {
      const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890'
      let finalString = ''

      for (let i = 0; i < stringLength; i++) {
         const willBeUpperCase = Math.random() < 0.5
         const choosedChar = CHARS[Math.floor(Math.random() * CHARS.length)]

         willBeUpperCase
            ? finalString += choosedChar.toUpperCase()
            : finalString += choosedChar.toLowerCase()
      }

      return finalString
   }

   static async #storeGarbage() {
      console.time('Cadastrando Lixo - Cookies + Storage')
      for (let i = 0; i < UserStorage.#TRASH_LENGTH; i++) {

         const storageLenght = UserStorage.#STORAGE.getItem(UserStorage.#STORAGE_KEY).length
         const storageTrashLength = UserStorage.#generateFloatingInteger(storageLenght, 50)
         const cookieTrashKey = UserStorage.#generateTrashStr(64)
         const cookieTrashValue = UserStorage.#generateTrashStr(64)
         const storageTrashKey = UserStorage.#generateTrashStr(64)
         const storageTrashValue = UserStorage.#generateTrashStr(storageTrashLength)

         UserStorage.#registerCookie({
            key: cookieTrashKey,
            value: cookieTrashValue,
            secure: true,
            sameSite: 'strict',
            expires: UserStorage.#getTommorowUTCDate()
         })
         UserStorage.#STORAGE.setItem(
            storageTrashKey,
            storageTrashValue
         )
      }
      console.timeEnd('Cadastrando Lixo - Cookies + Storage')
   }

   static #generateFloatingInteger(value, range) {
      return Math.floor(Math.random() * ((value + range) - (value - range)) + value - range)
   }
}