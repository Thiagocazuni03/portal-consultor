export default class ItemDatabase{

   static #DATABSE = null

   static setupDataBase(){
      return new Promise((resolve, reject) => {
         if(!window.indexedDB) reject('O seu dispositivo não suporta')

         const startReq = window.indexedDB.open('ItemDatabase', 1)

         startReq.onsuccess = (event) => ItemDatabase.#handleSuccess(event)
         startReq.onerror = (event) => ItemDatabase.#handleError(event).then(reject)
         startReq.onupgradeneeded = (event) => ItemDatabase.#createSchema(event).then(resolve)

      })
   }

   static saveItem(id, json){
      return new Promise(async (resolve, reject) => {
         const itemToSave = { id, json, date: new Date().getTime() }
         const addTransaction = ItemDatabase.#DATABSE.transaction('items', 'readwrite')
         const storeObject = addTransaction.objectStore('items')

         console.log(`Salvei o item: ${id}`)

         storeObject.put(itemToSave)
         addTransaction.oncomplete = (event) => resolve(event)
         addTransaction.onerror = (event) => reject(event)
      })
   }

   static getItem(id){
      return new Promise(resolve => {
         
         const getTransaction = ItemDatabase.#DATABSE.transaction('items', 'readwrite')
         const storeObject = getTransaction.objectStore('items')
         const getRequest = storeObject.get(id)

         console.log(`Busquei o item: ${id}`)

         getRequest.onsuccess = async ({ target }) => resolve(target.result)
      })
   }

   static clearDatabase(){
      return new Promise(resolve => {

         const getTransaction = ItemDatabase.#DATABSE.transaction('items', 'readwrite')
         const storeObject = getTransaction.objectStore('items')
         const clearRequest = storeObject.clear()

         clearRequest.onsuccess = () => resolve()
      })
   }


   static async #handleSuccess(event){
      ItemDatabase.#DATABSE = event.target.result
   }

   static async #handleError(event){
      throw new Error(event)
   }

   static async #createSchema(event){
      const database = event.target.result
      const itemsConfig = { keyPath: 'id', autoIncrement: false }
      database.createObjectStore('items', itemsConfig)
   }
}