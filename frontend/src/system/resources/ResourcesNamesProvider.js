import { ResourcesMapper } from './ResourcesMapper.js'

/**
 * Class responsável por lidar com os recursos e prover seus nomes
 * @author Fernando Petri
 */
export class ResourceNamesProvider {

   /**
    * Chaves novas para casos específicos quando se é necessário pegar um nome por outro ID além do principal
    */
   static SPECIFIC_KEYS = Object.freeze({
      MODEL_LINE: 'modelLine',
      CLASSIFICATIONS_WITH_MODEL: 'classificationsWithModel',
      COMPOSITIONS_CATEGORY: 'compositionsCategory',
      OPTIONAL_WITH_GROUPS: 'optionalWithGroups',
      OPTIONAL_BY_CHILDREN: 'optionalByChildren',
   })

   #resources
   #names

   /**
    * Instância a classe
    * @param {object} resources Os dados do produto já mapeados 
    */
   constructor(resources) {
      this.#resources = resources
      this.#names = {}

      this.#prepareHashes()
      this.#mapNames()

      //TODO: Implementar outros métodos quando necessário.
   }

   /**
    * Prepara as hashes para guardar os nomes
    */
   #prepareHashes() {
      const finalKeys = structuredClone(ResourcesMapper.FINAL_KEYS)

      delete finalKeys.PREDEFINED_MEASURES
      delete finalKeys.PRODUCT

      for (const finalKey of Object.values({ ...finalKeys, ...ResourceNamesProvider.SPECIFIC_KEYS })) {
         this.#names[finalKey] = {}
      }
   }

   /**
    * Mapeia os dados do produto e armazena seus nomes
    */
   #mapNames() {
      this.#mapModelNames(this.#resources[ResourcesMapper.FINAL_KEYS.MODELS])
      this.#mapClassificationNames(this.#resources[ResourcesMapper.FINAL_KEYS.CLASSIFICATIONS])
      this.#mapClassificationNamesWithModel(this.#resources[ResourcesMapper.FINAL_KEYS.CLASSIFICATIONS])
      this.#mapLineNames(this.#resources[ResourcesMapper.FINAL_KEYS.LINES])
      this.#mapModelLineNames(this.#resources[ResourcesMapper.FINAL_KEYS.LINES])
      this.#mapGroups(this.#resources[ResourcesMapper.FINAL_KEYS.GROUPS])
      this.#mapCompositions(this.#resources[ResourcesMapper.FINAL_KEYS.COMPOSITIONS])
      this.#mapCompositionsCategory(this.#resources[ResourcesMapper.FINAL_KEYS.COMPOSITIONS])
      this.#mapOptionals(this.#resources[ResourcesMapper.FINAL_KEYS.OPTIONALS])
      this.#mapOptionalsWithGroup(this.#resources[ResourcesMapper.FINAL_KEYS.OPTIONALS])
      this.#mapOptionalsByChildrenId(this.#resources[ResourcesMapper.FINAL_KEYS.OPTIONALS])
      this.#mapCombinations(this.#resources[ResourcesMapper.FINAL_KEYS.COMBINATIONS])
   }

   /**
    * Mapeia os nomes dos modelos
    * @param {object[]} models Os modelos
    */
   #mapModelNames(models = []) {
      models.forEach(model => {
         this.#names[ResourcesMapper.FINAL_KEYS.MODELS][model.id] = String(model.title)
      })
   }

   /**
    * Mapeia os nomes das classificações
    * @param {object[]} classifications As classificações
    */
   #mapClassificationNames(classifications = []) {
      classifications.forEach(classification => {
         this.#names[ResourcesMapper.FINAL_KEYS.CLASSIFICATIONS][classification.id] = String(classification.title)
      })
   }

   /**
    * Mapeia os nomes das classificações com modelo
    * @param {object[]} classifications As classificações
    */
   #mapClassificationNamesWithModel(classifications = []){
      classifications.forEach(classification => {
         const classificationName = classification.title
         const modelName = this.getModelName(classification.modelID)

         this.#names[ResourceNamesProvider.SPECIFIC_KEYS.CLASSIFICATIONS_WITH_MODEL][classification.id] = `${modelName} > ${classificationName}`
      })
   }

   /**
    * Mapeia os nomes das linhas
    * @param {object[]} lines As linhas
    */
   #mapLineNames(lines = []) {
      lines.forEach(line => {
         this.#names[ResourcesMapper.FINAL_KEYS.LINES][line.id] = String(line.title)
      })
   }

   /**
    * Mapeia os nomes das linhas com o ID do modelo
    * @param {object[]} lines As linhas
    */
   #mapModelLineNames(lines = []) {
      lines.forEach(line => {
         const modelName = this.getModelName(line.modelID)
         const lineName = String(line.title)
         const modelLineName = [modelName, lineName].join(' > ')

         this.#names[ResourceNamesProvider.SPECIFIC_KEYS.MODEL_LINE][line.modelLineID] = modelLineName
      })
   }

   /**
    * Mapeia os nomes dos grupos
    * @param {object[]} groups Os grupos
    */
   #mapGroups(groups = []) {
      groups.forEach(group => {
         this.#names[ResourcesMapper.FINAL_KEYS.GROUPS][group.id] = group.title
      })
   }

   /**
    * Mapeia os nomes das composições
    * @param {object[]} compositions As composições
    */
   #mapCompositions(compositions = []) {
      compositions.forEach(composition => {
         this.#names[ResourcesMapper.FINAL_KEYS.COMPOSITIONS][composition.id] = composition.title
      })
   }

   /**
    * Mapeia os nomes das composições
    * @param {object[]} compositions As composições
    */
   #mapCompositionsCategory(compositions = []) {
      compositions.forEach(composition => {
         const groupName = this.getGroupName(composition.groupID)
         const compositionName = this.getCompositionName(composition.id)
         const finalName = [groupName, compositionName].join(' > ')

         this.#names[ResourceNamesProvider.SPECIFIC_KEYS.COMPOSITIONS_CATEGORY][composition.categoryID] = finalName
      })
   }

   /**
    * Mapeia os nomes dos opcionais
    * @param {object[]} optionals A lista dos opcionais
    */
   #mapOptionals(optionals = []) {
      optionals.forEach(optional => {
         this.#names[ResourcesMapper.FINAL_KEYS.OPTIONALS][optional.id] = optional.title
      })
   }

   /**
    * Mapeia os nomes dos opcionais com os grupos
    * @param {object[]} optionals A lista dos opcionais
    */
   #mapOptionalsWithGroup(optionals = []) {
      optionals.forEach(optional => {
         const optionalName = this.getOptionalName(optional.id)
         const groupName = this.getGroupName(optional.groupID)
         const finalName = [groupName, optionalName].join(' > ')

         this.#names[ResourceNamesProvider.SPECIFIC_KEYS.OPTIONAL_WITH_GROUPS][optional.id] = finalName
      })
   }

   /**
    * Mapeia os opcionais pelo id children do mesmo
    * @param {object[]} optionals Os opcionais
    */
   #mapOptionalsByChildrenId(optionals = []){
      optionals.forEach(optional => {
         const optionalName = this.getOptionalName(optional.id)

         this.#names[ResourceNamesProvider.SPECIFIC_KEYS.OPTIONAL_BY_CHILDREN][optional.children] = optionalName
      })
   }

   /**
    * Mapeia os nomes das combinações
    * @param {object[]} combinations A lista das combinações
    */
   #mapCombinations(combinations = []) {
      combinations.forEach(combination => {
         this.#names[ResourcesMapper.FINAL_KEYS.COMBINATIONS][combination.primaryColor] = combination.title
      })
   }

   /**
    * Retorna o objeto com todos os nomes
    * @returns {Record<string, Record<string, string>}
    */
   getNames() {
      return this.#names
   }

   /**
    * Retorna o nome de um modelo
    * @param {number} modelID O ID do modelo
    * @returns {string | null} O nome do modelo ou nulo caso não for encontrado
    */
   getModelName(modelID) {
      return this.#names[ResourcesMapper.FINAL_KEYS.MODELS][modelID]
   }

   /**
    * Retorna o nome de uma linha
    * @param {number} lineID O ID da linha 
    * @returns {string | null} O nome da linha ou nulo
    */
   getLineName(lineID){
      return this.#names[ResourcesMapper.FINAL_KEYS.LINES][lineID]
   }

   /**
    * Retorna o nome da linha com modelo
    * @param {number} modelLineID O ID da linha do modelo
    * @returns {string | null} O nome ou nulo
    */
   getModelLineName(modelLineID) {
      return this.#names[ResourceNamesProvider.SPECIFIC_KEYS.MODEL_LINE][modelLineID]
   }

   /**
    * Retorna o nome de um grupo
    * @param {number} groupID O ID do grupo
    * @returns {string | null} O nome do grupo ou nulo caso não for encontrado
    */
   getGroupName(groupID) {
      return this.#names[ResourcesMapper.FINAL_KEYS.GROUPS][groupID]
   }

   /**
    * Retorna o nome de uma composição
    * @param {number} compositionID O ID da composição
    * @returns {string | null} O nome da composição ou nulo caso não for encontrado
    */
   getCompositionName(compositionID) {
      return this.#names[ResourcesMapper.FINAL_KEYS.COMPOSITIONS][compositionID]
   }

   /**
    * Retorna o nome de uma composição
    * @param {number} categoryID O ID de categoria da composição
    * @returns {string | null} O nome da composição ou nulo caso não for encontrado
    */
   getCompositionCategoryName(categoryID) {
      return this.#names[ResourceNamesProvider.SPECIFIC_KEYS.COMPOSITIONS_CATEGORY][categoryID]
   }

   /**
    * Retorna o nome de um opcional
    * @param {number} optionalID O ID do opcional
    * @returns {string | null} O nome do opcional ou nulo caso não for encontrado
    */
   getOptionalName(optionalID) {
      return this.#names[ResourcesMapper.FINAL_KEYS.OPTIONALS][optionalID]
   }

   /**
    * Retorna o nome dos opcionais com o grupo
    * @param {number} optionalID O ID do opcional
    * @returns {string | null} O ID do opcional ou nulo
    */
   getOptionalNameWithGroup(optionalID){
      return this.#names[ResourceNamesProvider.SPECIFIC_KEYS.OPTIONAL_WITH_GROUPS][optionalID]
   }

   /**
    * Retorna o nome de um opcional por um id children
    * @param {number} childrenID O id children do opcional 
    * @returns {string | null} O nome ou nulo
    */
   getOptionalNameByChildrenId(childrenID){
      return this.#names[ResourceNamesProvider.SPECIFIC_KEYS.OPTIONAL_BY_CHILDREN][childrenID]
   }

   /**
    * Retorna o nome das classificações
    * @param {number} classificationID O ID da classificação
    * @returns {string | null} O ID da classificação ou nulo
    */
   getClassificationName(classificationID){
      return this.#names[ResourcesMapper.FINAL_KEYS.CLASSIFICATIONS][classificationID]
   }

   /**
    * Retorna o nome de uma classificação com um modelo
    * @param {number} classificationID O ID da classificação
    * @returns {string | null} O ID da classificação ou nulo
    */
   getClassificationNameWithModel(classificationID){
      return this.#names[ResourceNamesProvider.SPECIFIC_KEYS.CLASSIFICATIONS_WITH_MODEL][classificationID]
   }

   /**
    * Retorna o nome da combinação buscada
    * @param {number} colorID O ID da cor da combinação
    * @returns {string | null} O nome
    */
   getCombinationName(colorID){
      return this.#names[ResourcesMapper.FINAL_KEYS.COMBINATIONS][colorID]
   }
}