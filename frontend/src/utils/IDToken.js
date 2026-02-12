/**
 * Classe para gerar token para uso em IDs de elementos HTML
 * @author Rodrigo Hoffmann
 */
export class IDToken {
   static usedTokens = []

   constructor() {
      this.token = this.generateToken()
   }

   getTimeToken(prefix) {
      const todayDate = new Date()
      const fullYear = String(todayDate.getFullYear())
      const month = String(todayDate.getMonth()).padStart(2, "0")
      const day = String(todayDate.getDay()).padStart(2, "0")
      const hours = String(todayDate.getHours()).padStart(2, "0")
      const minutes = String(todayDate.getMinutes()).padStart(2, "0")
      const seconds = String(todayDate.getSeconds()).padStart(2, "0")
      const randomNum = String(Math.floor(Math.random() * 999)).padStart(3, "0")

      return prefix + fullYear + month + day + hours + minutes + seconds + randomNum
   }

   /**
    * @returns {string} token
    */
   getToken() {
      return this.token
   }

   generateToken() {
      let newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const tokenWasUsedBefore = IDToken.usedTokens.includes(newToken)

      if (tokenWasUsedBefore) {
         newToken = this.generateToken()
      }

      return newToken
   }
}