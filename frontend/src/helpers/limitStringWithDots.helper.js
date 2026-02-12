/**
 * Limita uma stringa um certo número de caracteres, adiciona pontos (...) caso tenha ultrapassado este valor
 * @param {string} string A string 
 * @param {number} maxLength O tamanho máximo
 * @returns {string} O tamanho máximo
 */
export function limitStringWithDots(string, maxLength){
   const isBiggerThanLimit = string.length > maxLength

   if(isBiggerThanLimit){
      return string.slice(0, maxLength) + '...'
   }
   
   return string
}