/**
 * Classe utilitária 
 */
export default class Utils {

   /**
    * Retorna um identificador unique com prefixo
    * @param {string} prefix O prefixo 
    * @returns {string} O token
    */
   static generateUniqueToken(prefix) {
      const todayDate = new Date()
      const fullYear = String(todayDate.getFullYear())
      const month = String(todayDate.getMonth() + 1).padStart(2, '0')
      const day = String(todayDate.getDay()).padStart(2, '0')
      const hours = String(todayDate.getHours()).padStart(2, '0')
      const minutes = String(todayDate.getMinutes()).padStart(2, '0')
      const seconds = String(todayDate.getSeconds()).padStart(2, '0')
      const randomNum = String(Math.floor(Math.random() * 999)).padStart(3, '0')

      return prefix + fullYear + month + day + hours + minutes + seconds + randomNum
   }

   

   /**
    * Capitaliza uma string
    * @param {string} string A string
    * @returns {string} A string capitalizada
    */
   static capitalize(string){
      return string.charAt(0).toUpperCase() + string.slice(1)
   }

   static titleCase(string){
      return string.split(' ').map(word => {
         return word.charAt(0).toUpperCase() + word.slice(1)
      }).join(' ')
   }

   /**
    * Passa por um string e separa números repartidos por vírgula
    * @param {string} numbersString A string com números 
    * @returns {number[]} A lista de números
    */
   static parseNumbersString(numbersString) {
      if (!numbersString) {
         return []
      }

      return String(numbersString)
         .split(',')
         .map(Number)
         .filter(val => !Number.isNaN(val))
   }

   /**
    * Retorna se um determinado valor está entre outros dois
    * @param {number} minimum O valor mínimo
    * @param {number} value O valor sendo checado
    * @param {number} maximum O valor máximo
    * @returns {boolean} Se está entre
    */
   static isInRange(minimum, value, maximum) {
      return Number(value) >= Number(minimum) && Number(value) <= Number(maximum)
   }

   static partition(array, func) {
      const part1 = []
      const part2 = []

      array.forEach(element => {

         const result = func(element)

         if (result === true) part1.push(element)
         if (result === false) part2.push(element)

      })

      return [part1, part2]
   }

   static alphabet(upperCase) {
      return 'abcdefghijklmnopqrstuvwxyz'[upperCase ? 'toUpperCase' : 'toLowerCase']()
   }

   static sortAlphabeticaly(array, key) {
      return [...array].sort((itemA, itemB) => {
         if (itemA[key] < itemB[key]) return -1
         if (itemA[key] > itemB[key]) return 1
         return 0
      })
   }

   static isJSON(supposedJSON) {
      try {
         JSON.parse(supposedJSON)
      } catch (error) {
         return false
      }
      return true
   }

   static formatCPF(cpf) {
      if (cpf.length !== 11 || !cpf) return '000.000.000-00'

      return cpf.replace(/\D/gi, '').split('').map((number, index) => {

         if (index === 2) return number + '.'
         if (index === 5) return number + '.'
         if (index === 8) return number + '-'

         return number

      }).join('')
   }



   static formatCNPJ(cnpj) {
      if (cnpj.length !== 14 || !cnpj) return '00.000.000/0000-00'

      return cnpj.replace(/\D/gi, '').split('').map((number, index) => {

         if (index === 1) return number + '.'
         if (index === 4) return number + '.'
         if (index === 7) return number + '/'
         if (index === 11) return number + '-'

         return number

      }).join('')
   }

   static toHash(array, key = 'id') {
      const arrayEntries = array.map(item => [item[key], item])
      const asObject = Object.fromEntries(arrayEntries)

      return asObject
   }

   static tryToLoadImage(imageLink) {
      return new Promise((resolve, reject) => {
         const image = new Image(imageLink)
         image.onload = () => resolve()
         image.onerror = () => reject()
         image.src = imageLink
      })
   }

   static formatCurrency(string) {
      return Number(string).toFixed(2)
   }

   static formatDecimals(string, decimals = 2) {
      return parseFloat(Number(string).toFixed(decimals))
   }

   static stringToColor(string) {
      let hash = 0
      str.split('').forEach(char => {
         hash = char.charCodeAt(0) + ((hash << 5) - hash)
      })
      let colour = '#'
      for (let i = 0; i < 3; i++) {
         const value = (hash >> (i * 8)) & 0xff
         colour += value.toString(16).padStart(2, '0')
      }
      return colour
   }

   static normalizeString(string) {
      return string
         .normalize('NFD')
         .replace(/[\u0300-\u036f]/g, '')
         .toLowerCase()
   }

   static waitImageToLoad(imageUrl) {
      return new Promise((resolve, reject) => {
         const image = new Image()

         image.onload = () => resolve()
         image.onerror = () => reject()

         image.src = imageUrl
      })
   }
}