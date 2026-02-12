import FolderManager from '../core/FolderManager.js'

export default class PromotionFinder {

   /**
    * Retorna a promoção que se encaixa para o vendedor, revenda, grupo e produto
    * Pode retornar null caso não encontrar nada 
    */
   static async getPromotionFor({ memberID, groupID, productID }) {
      try {

         
         const folderManager = new FolderManager('portal/promotion', productID)
         const promotionFileNames = await folderManager.list()
         const validFileNames = promotionFileNames.filter(fileName => PromotionFinder.isPromotionValid({ fileName, memberID, groupID }))
         const validFileNameInfo = validFileNames.map(fileName => PromotionFinder.getInfoFromFileName(fileName))
         const sortedPromotions = validFileNameInfo.sort((promoA, promoB) => promoA.type - promoB.type)
         const selectedPromotion = sortedPromotions[0]

         if(!selectedPromotion) return null

         return await folderManager.read(selectedPromotion.fileName, 'json')

      } catch(error){

         console.error('Erro ao baixar promoções deste produto.')
         console.error(error)
         return null
         
      }
   }

   /**
    * Traz todos os nomes dos arquivos de promoçõse presentes na pasta do produto 
    */
   static async getPromotions(productID) {
      return await new FolderManager('portal/promotion', productID).list()
   }

   /**
    * Retorna se uma promoção é válida baseada em seu nome de arquivo 
    */
   static isPromotionValid({ fileName, memberID, groupID }) {
      if (!PromotionFinder.isFileNameValid(fileName)) return false

      const promotionInfo = this.getInfoFromFileName(fileName)

      
      const isDateInRange = new Date(promotionInfo.startDate).getTime() <= new Date().getTime() && new Date().getTime() <= new Date(promotionInfo.endDate)
      const isGroupValid = promotionInfo.groups.includes(Number(groupID))
      const isExcluded = promotionInfo.excluded.includes(Number(memberID))
      const isSelected = promotionInfo.ressellers.includes(Number(memberID))

      //Caso for "Seleção de revendas"
      if (promotionInfo.type === 1 && (isSelected && isDateInRange)) {
         return true
      }

      //Caso for "Seleção de grupos"
      if (promotionInfo.type === 2 && (isGroupValid && isDateInRange && !isExcluded)) {
         return true
      }

      //Caso for "Todas revendas"
      if (promotionInfo.type === 3 && !isExcluded) {
         return true
      }

      return false
   }

   /**
    * Retorna as informações do nome de um arquivo 
    */
   static getInfoFromFileName(fileName) {

      const nameParts = fileName.split('-')
      const nameValues = {}

      const keyAliases = {
         gr: 'groups',
         st: 'startDate',
         ed: 'endDate',
         tp: 'type',
         er: 'excluded',
         re: 'ressellers'
      }

      let currentKey = null

      nameParts.forEach(part => {

         const isKey = /^[a-z]*$/gi.test(part)
         const wasDefined = nameValues[keyAliases[part]]

         if (isKey && !wasDefined) {

            currentKey = keyAliases[part]
            nameValues[currentKey] = []

         } else {

            nameValues[currentKey].push(part)

         }
      })

      nameValues.fileName = fileName
      nameValues.type = Number(nameValues.type[0])

      nameValues.startDate = nameValues.startDate.slice(0, 3).reverse().join('-') + 'T' + nameValues.startDate.slice(3).join(':')
      nameValues.endDate = nameValues.endDate.slice(0, 3).reverse().join('-') + 'T' + nameValues.endDate.slice(3).join(':')

      nameValues.groups = nameValues.groups.map(Number)
      nameValues.excluded = nameValues.excluded.map(Number)
      nameValues.ressellers = nameValues.ressellers.map(Number)


      return nameValues
   }

   /**
    * Retorna se um nome de arquivo é uma promoção válida 
    */
   static isFileNameValid(fileName) {
      return PromotionFinder.getFileNameRequiredKeys().every(key => fileName.includes(key))
   }

   /**
    * Retorna as chaves que devem estar presentes no nome do arquivo da promoção 
    */
   static getFileNameRequiredKeys() {
      return [
         'tp', //Tipo
         'gr', //Grupos
         'er', //Vendedores exclusos
         're', //Vendedores
         'st', //Data inicial
         'ed', //Data final
      ]
   }

}