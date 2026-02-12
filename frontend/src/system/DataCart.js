import Utils from '../core/Utils.js'

export default class DataCart {

   #warranty
   #environment
   #identifier
   #product
   #quantity
   #information

   constructor({
      product,
      identifier = Utils.generateUniqueToken('PRD'),
      measures = [],
      additionals = [],
      compositions = [],
      quantity = 1,
      model = null,
      classification = null,
      subclassification = null,
      line = null,
      time = Date.now(),
      information = null,
      warranty = null,
      environment = null,
      isFinished = false,
      extract = null,
      registerCount = {},
      daysToProduce = null
   } = {}) {

      if (!product) {
         throw new Error('Não crie um produto sem suas descrições')
      }
      
   
      
      this.isFinished = isFinished
      this.measures = measures
      this.model = model
      this.classification = classification
      this.subclassification = subclassification
      this.line = line
      this.additionals = additionals
      this.compositions = compositions
     
      
      
      this.extract = extract
      this.registerCount = registerCount
      this.daysToProduce = daysToProduce
      this.time = time

      this.#identifier = identifier
      this.#information = information
      this.#quantity = quantity
      this.#product = product
      this.#environment = environment
      this.#warranty = warranty
   }

   /**
    * Retorna o id do produto
    * @returns {number} O id
    */
   getProductID() {
      return this.#product.id
   }

   /**
    * Retorna o ID identificador do produto
    * @returns {string} O ID 
    */
   getIdentifier() {
      return this.#identifier
   }

   /**
    * Retorna as informações de visualização do produto
    * @returns {object} Os dados do produto
    */
   getProduct() {
      return this.#product
   }

   /**
    * Retorna a imagem do produto
    * @returns {string | null} A imagem do produto
    */
   getProductImage() {
      return this.#product.image
   }

   /**
    * Retorna o título do produto
    * @returns {string} O título
    */
   getProductTitle() {
      return this.#product.title
   }

   /**
    * Retorna as medidas atuais
    * @returns {object[]} A lista de medidas do item
    */
   getMeasures() {
      return this.measures
   }

   /**
    * Retorna as medidas totais do produto
    * @returns {Record<string, number>} As medidas totais
    */
   getTotalMeasures() {
      return {
         width: this.getTotalWidth(),
         height: this.getTotalHeight(),
         area: this.getTotalArea()
      }
   }

   /**
    * Retorna a quantia de medidas deste produto
    * @returns {number} A quantia de medidas
    */
   getMeasuresAmount() {
      return this.getMeasures().length
   }

   /**
    * Retorna o tamanho total de largura
    * @returns {number} A largura total
    */
   getTotalWidth() {
      return this.getMeasures().reduce((total, measure) => {

         return total + measure.width

      }, 0)
   }

   /**
    * Retorna o tamanho total de altura
    * @returns {number} A altura total
    */
   getTotalHeight() {
      return this.getMeasures().reduce((total, measure) => {

         return measure.height > total ? measure.height : total

      }, 0)
   }

   /**
    * Retorna o tamanho total de área
    * @returns {number} A área total
    */
   getTotalArea() {
      return this.getMeasures().reduce((total, measure) => {

         return total + measure.area

      }, 0)
   }

   /**
    * Retorna o modelo atual do carrinho
    * @returns {object | null} O modelo selecionado
    */
   getModel() {
      return this.model
   }

   /**
    * Retorna o ID do modelo selecionado
    * @returns {number | null} O númer ou nulo caso não tiver selecionado
    */
   getModelID() {
      return this.model?.id ?? null
   }

   /**
    * Retorna se tem um modelo selecionado
    * @returns {boolean} Se tem um modelo selecionado
    */
   hasModelSelected() {
      return Boolean(this.getModel()?.id)
   }

   /**
    * Retorna a linha do carrinho
    * @returns {object | null} A linha
    */
   getLine() {
      return this.line
   }

   /**
    * Retorna o ID da linha selecionada
    * @returns {number | null} O númer ou nulo caso não tiver selecionado
    */
   getLineID() {
      return this.line?.id ?? null
   }

   /**
    * Retorna o id do modelo linha do carrinho
    * @returns {number | null} O ID ou nulo
    */
   getModelLineID() {
      return this.getLine()?.modelLineID ?? null
   }

   /**
    * Define a garantia escolhida para este produto
    * @param {object} warranty A garantia
    */
   setWarranty(warranty) {
      this.#warranty = warranty
   }

   /**
    * Retorna a garantia escolhida do usuário
    * @returns {object} A garantia escolhida
    */
   getWarranty() {
      return this.#warranty
   }

   /**
    * Retorna a classificação atual do carrinho
    * @returns {object | null} A classificação selecionado
    */
   getClassification() {
      return this.classification
   }

   /**
    * Retorna o ID da classificação selecionada
    * @returns {number | null} O número ou nulo caso não tiver selecionada
    */
   getClassificationID() {
      return this.classification?.id ?? null
   }

   /**
    * Retorna a subclassificação atual do carrinho
    * @returns {object | null} A subclassificação selecionado
    */
   getSubclassification() {
      return this.subclassification
   }

   /**
    * Retorna as composições adicionadas na montagem
    * @returns {object[]} A lista de opções confirmadas
    */
   getConfirmedOptions = function () {
      return this.compositions
   }

   /**
    * Retorna as opções confirmadas de um grupo
    * @param {number} groupID O ID do grupo 
    * @returns {object[]} A lista de opções confirmadas de um grupo
    */
   getConfirmedOptionsForGroup = function (groupID) {
      return this.getConfirmedOptions().filter(option => option.groupID === groupID)
   }

   /**
    * Retorna os IDS dos grupos presentes n ocarrinho
    * @returns {number[]} A lista de IDS
    */
   getGroupIDS() {
      return [...new Set(this.getConfirmedOptions().map(option => option.groupID))]
   }

   /**
    * Retorna a quantidade 
    * @returns {number}
    */
   getQuantity() {
      return this.#quantity
   }

   /**
    * Define as informações do produto
    * @param {string} information A informação 
    */
   setInformation(information) {
      this.#information = information
   }

   /**
    * Retorna as informações do usuário
    * @returns {object} As informações 
    */
   getInformation() {
      return this.#information
   }

   /**
    * Define um ambiente para este produto
    * @param {object} environment O ambiente 
    */
   setEnvironment(environment) {
      this.#environment = environment
   }

   /**
    * Retorna o ambiente selecionado
    * @returns {object | null} O ambiente
    */
   getEnvironment() {
      return this.#environment
   }

   /**
    * Adiciona um valor a quantidade
    * @param {number} quantity A quantidade 
    */
   addQuantity(quantity) {
      this.#quantity = Math.min(this.#quantity + quantity, 10)
   }

   /**
    * Reduz um valor da quantidade
    * @param {number} quantity A quantidade 
    */
   reduceQuantity(quantity) {
      this.#quantity = Math.max(this.#quantity - quantity, 1)
   }

   /**
    * Adiciona um valor a quantidade
    * @param {number} quantity A quantidade 
    */
   setQuantity(quantity) {
      this.#quantity = Math.max(0, Math.min(quantity, 10))
   }

   /**
    * Retorna os ids relacionados
    * @returns {number[]} A lista de IDS
    */
   getRelatedProductsIds() {
      const relatedIds = this.getConfirmedOptions()
         .filter(option => option.relatedProducts)
         .map(option => option.relatedProducts ?? '')
         .flatMap(relatedProducts => relatedProducts.split(','))
         .filter(Boolean)
         .map(Number)
      
      const uniqueIds = Array.from(
         new Set(relatedIds)
      )

      return uniqueIds
   }

   /**
    * Retorna os produtos relacionados indicados pelo modelo
    * @returns {number[]} A lista de Ids
    */
   getModelRelatedProductIds(){
      const model = this.getModel()
      const hasModel = Boolean(model)

      if(!hasModel){
         return []
      }
      
      const relatedProductsString = model.productsRelated ?? ''
      const relatedIds = Utils.parseNumbersString(relatedProductsString)

      return relatedIds
   }

   /**
    * Retorna todas as váriaveis relacionadas com este produto
    * @returns {Record<string, any>} Todas as váriaveis
    */
   getVariables() {
      return {
         ...this.getStandardVariables(),
         ...this.getFormVariables(),
      }
   }

   /**
    * Retorna as váriaveis padrões
    * @returns {Record<string, number>} As váriaveis padrões
    */
   getStandardVariables() {
      const variables = {
         L: this.getTotalWidth(),
         W: this.getTotalWidth(),
         A: this.getTotalHeight(),
         H: this.getTotalHeight(),
         LT: this.getTotalWidth()
      }

      this.getMeasures().forEach(measure => {
         variables['L' + measure.id] = measure.width
         variables['W' + measure.id] = measure.width
         variables['A' + measure.id] = measure.height
         variables['H' + measure.id] = measure.height
      })

      return variables
   }

   /**
    * Retorna as váriaveis provenientes de formulários
    * @returns {Record<string, any>} As váriaveis
    */
   getFormVariables() {
      const variables = {}

      this.getConfirmedOptions()
         .flatMap(option => option.forms)
         .filter(Boolean)
         .filter(form => !!form.variable)
         .forEach(form => variables[form.variable] = form.value)

      return variables
   }
}