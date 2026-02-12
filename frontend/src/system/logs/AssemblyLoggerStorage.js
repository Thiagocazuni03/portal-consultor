
/**
 * Classe responsável por salvar e retornar os logs salvos pelo usuário
 * @abstract Não deve ser instânciada
 * @author Fernando Petri
 */
export class AssemblyLoggerStorage{

   /**
   * A chave que salva os logs de montagem na storage
   */
  static #STORAGE_KEY = 'SAVED_LOGS'

   /**
    * Previne a construção
    */
   constructor(){
      throw new Error(`A classe ${this.constructor.foo} não deve ser instânciada`)   
   }

   /**
    * Salva um log localmente
    * @param {object} log O novo log 
    */
   static save(log){
      const savedLogs = this.getLogs()
      const newList = [...savedLogs, log]
   
      this.#saveToStorage(newList)
   }

   /**
    * Deleta um log da lista de logs
    * @param {string} id O ID do log 
    */
   static delete(id){
      const savedLogs = this.getLogs()
      const newList = savedLogs.filter(log => log.id !== id)

      this.#saveToStorage(newList)
   }

   /**
    * Remove todos os logs salvos
    */
   static clear(){
      this.#saveToStorage([])
   }

   /**
    * Retorna a lista de logs salvos
    * @returns {object[]} A lista de logs
    */
   static getLogs(){
      try{

         const savedData = localStorage.getItem(this.#STORAGE_KEY)
         const savedLogs = savedData ? JSON.parse(savedData) : []
   
         return savedLogs

      } catch(error){

         return []

      }
   }

   /**
    * Salva os dados na localStorage
    * @param {object[]} logs A lista de logs 
    */
   static #saveToStorage(logs){
      localStorage.setItem(
         this.#STORAGE_KEY,
         JSON.stringify(logs)
      )
   }
}