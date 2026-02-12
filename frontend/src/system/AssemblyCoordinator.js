import Utils from '../core/Utils.js'
import AssemblyCartAdapter from './cart/AssemblyCartAdapter.js'
import DataCart from './DataCart.js'
import Ruler from './Ruler.js'

/**
 * Classe responsável por coordenar a montagem de um produto
 * @author Fernando Petri
 */
export class AssemblyCoordinator {

   #resources
   #dataCart
   #cartAdapter
   #checkedCompositionRules
   #checkedOptionalRules

   /**
    * Instância o coordenador da montagem
    * @param {object} resources Os recursos de montagem 
    * @param {DataCart} dataCart O produto
    * @param {AssemblyCartAdapter} cartAdapter O adaptador do carrinho
    */
   constructor(resources, dataCart, cartAdapter) {
      this.#resources = resources
      this.#dataCart = dataCart
      this.#cartAdapter = cartAdapter
      this.#checkedCompositionRules = []
      this.#checkedOptionalRules = []
   }

   /**
    * Retorna se deve usar medidas predefinidas de largura
    * @returns {boolean} Se deve usar
    */
   shouldUseWidthPredefinedMeasures() {
      return Boolean(this.#resources.measures.usePredefinedWidth)
   }

   /**
    * Retorna se deve usar medidas predefinidas de altura
    * @returns {boolean} Se deve usar
    */
   shouldUseHeightPredefinedMeasures() {
      return Boolean(this.#resources.measures.usePredefinedHeight)
   }

   /**
    * Retorna as medidas predefinidas de largura
    * @returns {number[]} A lista de medidas predefinidas
    */
   getWidthPredefinedMeasures() {
      return Utils.parseNumbersString(this.#resources.measures.predefinedWidths)
   }

   /**
    * Retorna as medidas predefinidas de altura
    * @returns {number[]} A lista de medidas predefinidas
    */
   getHeightPredefinedMeasures() {
      return Utils.parseNumbersString(this.#resources.measures.predefinedHeights)
   }

   /**
    * Retorna os dados do produto em questão
    * @returns {object} O produto em questão
    */
   getProductInformation() {
      return this.#resources.product
   }

   /**
    * Retorna a configuração de layout do produto
    * @returns {object} A configuração
    */
   getProductLayout() {
      return this.getProductInformation().layout
   }

   /**
    * Retorna se os dois campos de medidas estão escondidos
    * @returns {boolean} Se estão escondidos
    */
   isBothMeasureInputsHidden() {
      return this.isWidthInputHidden() && this.isHeightInputHidden()
   }

   /**
    * Retorna a quantidade de peças está
    * @returns {boolean} Se está escondidos
    */
   isPiecesAmountHidden() {
      return Boolean(this.getProductLayout().hidePiece)
   }

   /**
    * Retorna se o campo de largura nas medidas está escondido
    * @returns {boolean} Se está escondido
    */
   isWidthInputHidden() {
      return Boolean(this.getProductLayout().hideWidth)
   }

   /**
    * Retorna se o campo de altura nas medidas está escondido
    * @returns {boolean} Se está escondido
    */
   isHeightInputHidden() {
      return Boolean(this.getProductLayout().hideHeight)
   }

   /**
    * Retorna se o campo de área nas medidas está escondido
    * @returns {boolean} Se está escondido
    */
   isAreaInputHidden() {
      return Boolean(this.getProductLayout().hideArea)
   }

   /**
    * Retorna a quantidade máxima de peças para este produto
    * @returns {number} A quantidade máxima
    */
   getMaximumPiecesAmount() {
      return Number(this.getProductInformation().maxPieces)
   }

   /**
    * Retorna a nomenclatura do produto
    * @returns {object} A nomeclatura
    */
   getNomenclature() {
      return this.getProductInformation().nomenclature
   }

   /**
    * Retorna a nomenclatura da peça
    * @returns {string} A nomenclatura
    */
   getPieceNomenclature() {
      return this.getNomenclature().piece ?? 'PÇ'
   }

   /**
    * Retorna a nomenclatura da largura
    * @returns {string} A nomenclatura
    */
   getWidthNomenclature() {
      return this.getNomenclature().width ?? 'Larg'
   }

   /**
    * Retorna a nomenclatura da altura
    * @returns {string} A nomenclatura
    */
   getHeightNomenclature() {
      return this.getNomenclature().height ?? 'Alt'
   }

   /**
    * Retorna a nomenclatura da altura
    * @returns {string} A nomenclatura
    */
   getAreaNomenclature() {
      return this.getNomenclature().area ?? 'Alt'
   }

   /**
    * Retorna a nomenclatura do modelo
    * @returns {string} A nomenclatura
    */
   getModelNomenclature() {
      return this.getNomenclature().model ?? 'Modelo'
   }

   /**
   * Retorna a nomenclatura da linha
   * @returns {string} A nomenclatura
   */
   getLinesNomenclature() {
      return this.getNomenclature().line ?? 'Linha'
   }

   /**
    * Retorna a nomenclatura dos opcionais
    * @returns {string} A nomenclatura 
    */
   getGroupsNomenclature() {
      return this.getNomenclature().optionals ?? 'Opcionais'
   }

   /**
    * Retorna os modelos deste produto
    * @returns {object[]} A lista de modelos
    */
   getModels() {
      return this.#resources.models
   }

   /**
    * Retorna os modelos válidos para o carrinho atualmente
    * @param {object[]} models A lista de modelos para filtrar
    * @returns {object[]} A listade modelos válidos
    */
   getValidModels(models = this.getModels()) {

      return models
         .filter(model => this.isModelValidByPiecesAmount(model))
         .filter(model => this.isModelValidByProductsRelation(model))
         .filter(model => this.isModelValidByTotalMeasure(model))
         .filter(model => this.isModelValidByPiecesMeasures(model))
         .filter(model => this.isModelValidByNonStandardMeasures(model))
         .filter(model => this.isModelValidByPredefinedWidthMeasures(model))
         .filter(model => this.isModelValidByPredefinedHeightMeasures(model))
   }

   /**
    * Retorna se um modelo é válido para a quantidade de peças
    * @param {object} model O modelo em questão
    * @returns {boolean} Se o modelo é valido para a quantidade de peças do carrinho 
    */
   isModelValidByPiecesAmount(model) {
      if (this.isBothMeasureInputsHidden()) {
         return true
      }

      return Number(model.piece) === this.#dataCart.getMeasuresAmount()
   }

   /**
    * Retorna se um modelo é valido pela relação de produtos
    * @param {object} model O modelo em questão
    * @returns {boolean} Se o modelo é válido 
    */
   isModelValidByProductsRelation(model) {
      const productsRelated = Utils.parseNumbersString(model.productsRelated)
      const needsRelation = productsRelated.length

      if (!needsRelation) {
         return true
      }

      let cartProductsIds = []

      if (this.#cartAdapter) {
         cartProductsIds = this.#cartAdapter.getProducts().map(product => {
            return product.product.id
         })
      }

      return productsRelated.some(productID => cartProductsIds.includes(productID))
   }

   /**
    * Retorna se um modelo é valido pelas medidas do carrinho
    * @param {object} model O modelo em questão
    * @returns {boolean} Se é valido por uma medida do carrinho
    */
   isModelValidByTotalMeasure(model) {
      if (this.isBothMeasureInputsHidden()) {
         return true
      }
      if (this.isModelIgnoringTotalMeasuresVerification(model)) {
         return true
      }

      const isWidthValid = this.isModelValidByTotalWidth(model) || !Number(model.measures.standard.maxW)
      const isHeightValid = this.isModelValidByTotalHeight(model) || !Number(model.measures.standard.maxH)
      const isAreaValid = this.isModelValidByTotalArea(model) || !Number(model.measures.standard.maxS)

      return isWidthValid && isHeightValid && isAreaValid
   }

   /**
    * Retorna se um modelo está ignorando as medidas totais
    * @param {object} model O modelo em questão
    * @returns {boolean} Se está ignorando
    */
   isModelIgnoringTotalMeasuresVerification(model) {
      return Boolean(model.measures.ignoreMeasures)
   }

   /**
    * Retorna se o modelo é válido para o tamanho total de largura
    * @param {object} model O modelo em questão
    * @returns {boolean} Se o modelo é válido ou não 
    */
   isModelValidByTotalWidth(model) {
      if (this.isWidthInputHidden()) {
         return true
      }

      const minimumWidth = Number(model.measures.standard.minW ?? Number.NEGATIVE_INFINITY)
      const maximumWidth = Number(model.measures.standard.maxW ?? Number.POSITIVE_INFINITY)
      const isWidthValid = Utils.isInRange(minimumWidth, this.#dataCart.getTotalWidth(), maximumWidth)

      return isWidthValid
   }

   /**
    * Retorna se o modelo é válido para o tamanho total de altura
    * @param {object} model O modelo em questão
    * @returns {boolean} Se o modelo é válido ou não 
    */
   isModelValidByTotalHeight(model) {
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumHeight = Number(model.measures.standard.minH ?? Number.NEGATIVE_INFINITY)
      const maximumHeight = Number(model.measures.standard.maxH ?? Number.POSITIVE_INFINITY)
      const isHeightValid = Utils.isInRange(minimumHeight, this.#dataCart.getTotalHeight(), maximumHeight)

      return isHeightValid
   }

   /**
    * Retorna se o modelo é válido para o tamanho total de altura
    * @param {object} model O modelo em questão
    * @returns {boolean} Se o modelo é válido ou não 
    */
   isModelValidByTotalArea(model) {
      if (this.isWidthInputHidden()) {
         return true
      }
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumArea = Number(model.measures.standard.minS ?? Number.NEGATIVE_INFINITY)
      const maximumArea = Number(model.measures.standard.maxS ?? Number.POSITIVE_INFINITY)
      const isAreaValid = Utils.isInRange(minimumArea, this.#dataCart.getTotalArea(), maximumArea)

      return isAreaValid
   }

   /**
    * Retorna se o modelo é válido pelas medidas de peças
    * @param {object} model O modelo em questão
    * @returns {boolean} Se é válido pelas medidas de peças
    */
   isModelValidByPiecesMeasures(model) {
      if (this.isBothMeasureInputsHidden()) {
         return true
      }
      if (this.isModelIgnoringPiecesMeasuresVerification(model)) {
         return true
      }

      const measures = this.#dataCart.getMeasures()
      const isValid = measures.every(measure => this.isModelMeasuresValidForMeasure(model, measure))

      return isValid
   }

   /**
    * Retorna se um modelo está ignorando as medidas por peça
    * @param {object} model O modelo em questão
    * @returns {boolean} Se está ignorando
    */
   isModelIgnoringPiecesMeasuresVerification(model) {
      return Boolean(model.measures.ignorePieceMeasures)
   }

   /**
    * Retorna se um modelo é válido para uma medida
    * @param {object} model O modelo em questão
    * @param {object} measure A medida em questão
    * @returns {boolean} Se é válido
    */
   isModelMeasuresValidForMeasure(model, measure) {
      if (this.isBothMeasureInputsHidden()) {
         return true
      }

      const isWidthValid = this.isModelPieceWidthValidForMeasure(model, measure) || !Number(model.measures.standard.maxWP)
      const isHeightValid = this.isModelPieceHeightValidForMeasure(model, measure) || !Number(model.measures.standard.maxHP)
      const isAreaValid = this.isModelPieceAreaValidForMeasure(model, measure) || !Number(model.measures.standard.maxSP)

      return isWidthValid && isHeightValid && isAreaValid
   }

   /**
    * Retorna se a largura por peça do modelo é válido para uma medida
    * @param {object} model O modelo em questão 
    * @param {object} measure A medida em questão 
    */
   isModelPieceWidthValidForMeasure(model, measure) {
      if (this.isWidthInputHidden()) {
         return true
      }

      const minimumWidth = Number(model.measures.standard.minWP ?? Number.NEGATIVE_INFINITY)
      const maximumWidth = Number(model.measures.standard.maxWP ?? Number.POSITIVE_INFINITY)
      const isWidthValid = Utils.isInRange(minimumWidth, Number(measure.width), maximumWidth)

      return isWidthValid
   }

   /**
    * Retorna se a altura por peça do modelo é válido para uma medida
    * @param {object} model O modelo em questão 
    * @param {object} measure A medida em questão 
    */
   isModelPieceHeightValidForMeasure(model, measure) {
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumHeight = Number(model.measures.standard.minHP ?? Number.NEGATIVE_INFINITY)
      const maximumHeight = Number(model.measures.standard.maxHP ?? Number.POSITIVE_INFINITY)
      const isHeightValid = Utils.isInRange(minimumHeight, Number(measure.height), maximumHeight)

      return isHeightValid
   }

   /**
    * Retorna se a área por peça do modelo é válido para uma medida
    * @param {object} model O modelo em questão 
    * @param {object} measure A medida em questão 
    */
   isModelPieceAreaValidForMeasure(model, measure) {
      if (this.isWidthInputHidden()) {
         return true
      }
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumArea = Number(model.measures.standard.minSP ?? Number.NEGATIVE_INFINITY)
      const maximumArea = Number(model.measures.standard.maxSP ?? Number.POSITIVE_INFINITY)
      const isAreaValid = Utils.isInRange(minimumArea, Number(measure.area), maximumArea)

      return isAreaValid
   }

   /**
    * Retorna se um modelo é válido por medidas não padrões
    * @param {object} model O modelo em questão
    * @returns {boolean} Se é válido
    */
   isModelValidByNonStandardMeasures(model) {
      if (!this.isModelNonStandard(model)) {
         return true
      }
      if (this.isBothMeasureInputsHidden()) {
         return true
      }

      const isWidthValid = this.isModelValidByNonStandardWidth(model) || !Number(model.measures.nonStandard.nonMaxW)
      const isHeightValid = this.isModelValidByNonStandardHeight(model) || !Number(model.measures.nonStandard.nonMaxH)
      const isAreaValid = this.isModelValidByNonStandardArea(model) || !Number(model.measures.nonStandard.nonMaxS)

      return isWidthValid && isHeightValid && isAreaValid
   }

   /**
    * Retorna se um modelo tem medidas fora do padrão ativas
    * @param {object} model O modelo em questão
    * @returns {boolean} Se usa medidas fora do padrão e estão ativas
    */
   isModelNonStandard(model) {
      return Boolean(model.measures.isNonStandard)
   }

   /**
    * Retorna se um modelo é válido pela largura da medida não padrão
    * @param {object} model O modelo em questão
    * @returns {boolean} Se é válido ou não
    */
   isModelValidByNonStandardWidth(model) {
      if (this.isWidthInputHidden()) {
         return true
      }

      const minimumWidth = Number(model.measures.nonStandard.nonMinW ?? Number.NEGATIVE_INFINITY)
      const maximumWidth = Number(model.measures.nonStandard.nonMaxW ?? Number.POSITIVE_INFINITY)
      const isWidthValid = Utils.isInRange(minimumWidth, this.#dataCart.getTotalWidth(), maximumWidth)

      return isWidthValid
   }

   /**
    * Retorna se um modelo é válido pela altura da medida não padrão
    * @param {object} model O modelo em questão
    * @returns {boolean} Se é válido ou não
    */
   isModelValidByNonStandardHeight(model) {
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumHeight = Number(model.measures.nonStandard.nonMinH ?? Number.NEGATIVE_INFINITY)
      const maximumHeight = Number(model.measures.nonStandard.nonMaxH ?? Number.POSITIVE_INFINITY)
      const isHeightValid = Utils.isInRange(minimumHeight, this.#dataCart.getTotalHeight(), maximumHeight)

      return isHeightValid
   }

   /**
    * Retorna se um modelo é válido pela area da medida não padrão
    * @param {object} model O modelo em questão
    * @returns {boolean} Se é válido ou não
    */
   isModelValidByNonStandardArea(model) {
      if (this.isWidthInputHidden()) {
         return true
      }
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumArea = Number(model.measures.nonStandard.nonMinS ?? Number.NEGATIVE_INFINITY)
      const maximumArea = Number(model.measures.nonStandard.nonMaxS ?? Number.POSITIVE_INFINITY)
      const isAreaValid = Utils.isInRange(minimumArea, this.#dataCart.getTotalArea(), maximumArea)

      return isAreaValid
   }

   /**
    * Retorna se um modelo é válido por suas medidas predefinidas de largura
    * @param {object} model O modelo em questão
    * @returns {boolean} Se é válido
    */
   isModelValidByPredefinedWidthMeasures(model) {
      if (!this.isModelPredefinedWidthsActive(model)) {
         return true
      }
      if (this.isWidthInputHidden()) {
         return true
      }

      const predefinedMeasures = Utils.parseNumbersString(model.predefinedMeasures.predefinedWidths)
      const isSomeMeasureValid = predefinedMeasures.includes(this.#dataCart.getTotalWidth())

      return isSomeMeasureValid
   }

   /**
    * Retorna se deve ser verificado se as medidas do produto se encaixam nas medidas predefinidas do modelo
    * @param {object} model O modelo em questão 
    * @returns {boolean} Se deve ser verificado
    */
   isModelPredefinedWidthsActive(model) {
      return Boolean(model.predefinedMeasures.checkWidth)
   }

   /**
    * Retorna se um modelo é válido por suas medidas predefinidas de altura
    * @param {object} model O modelo em questão
    * @returns {boolean} Se é válido
    */
   isModelValidByPredefinedHeightMeasures(model) {
      if (!this.isModelPredefinedHeightsActive(model)) {
         return true
      }
      if (this.isHeightInputHidden()) {
         return true
      }

      const predefinedMeasures = Utils.parseNumbersString(model.predefinedMeasures.predefinedHeights)
      const isSomeMeasureValid = predefinedMeasures.includes(this.#dataCart.getTotalHeight())

      return isSomeMeasureValid
   }

   /**
    * Retorna se deve ser verificado se as medidas do produto se encaixam nas medidas predefinidas do modelo
    * @param {object} model O modelo em questão 
    * @returns {boolean} Se deve ser verificado
    */
   isModelPredefinedHeightsActive(model) {
      return Boolean(model.predefinedMeasures.checkHeight)
   }

   /**
    * Retorna as classificações de todos os modelos
    * @returns {object[]} A lista de classificações dos modelos
    */
   getClassifications() {
      return this.#resources.classifications.filter(classification => {
         return this.isClassificationFatherless(classification)
      })
   }

   /**
    * Retorna as classificações válidas para os dados atuais da montagem
    * @param {object[]} classifications A lista de classificações para filtrar
    * @returns {object[]} A lista de classificações válidas
    */
   getValidClassifications(classifications = this.getClassifications()) {
      return classifications
         .filter(classification => this.isClassificationValidByPiecesAmount(classification))
         .filter(classification => this.isClassificationValidByPieceMeasures(classification))
   }

   /**
    * Retorna as classificações válidas para um modelo
    * @param {number} modelID O ID do modelo 
    * @returns {object[]} A lista de classificações
    */
   getValidClassificationsForModel(modelID) {
      return this.getValidClassifications().filter(classification => classification.modelID === modelID)
   }

   /**
    * Retorna se a classificação é válida pela quantidade de peças do produto
    * @param {object} classification A classificação 
    * @returns {boolean} A classificação
    */
   isClassificationValidByPiecesAmount(classification) {
      return Number(classification.piece) === this.#dataCart.getMeasuresAmount()
   }

   /**
    * Retorna se uma classificação não possui pai
    * @param {object} classification A classificação em questão 
    * @returns {boolean} Se não possui pai
    */
   isClassificationFatherless(classification) {
      return !classification.parent
   }

   /**
    * Retorna se uma subclassificação é válida para os tamanhos das peças
    * @param {object} classification A classificação em questão
    * @returns {boolean} Se é válida ou não 
    */
   isClassificationValidByPieceMeasures(classification) {
      return this.#dataCart.getMeasures().every(measure => {
         if (this.isBothMeasureInputsHidden()) {
            return true
         }

         const isWidthValid = this.isClassificationPieceWidthValid(classification, measure) || !Number(classification.measures.maxW)
         const isHeightValid = this.isClassificationPieceHeightValid(classification, measure) || !Number(classification.measures.maxH)
         const isAreaValid = this.isClassificationPieceAreaValid(classification, measure) || !Number(classification.measures.maxS)

         return isWidthValid && isHeightValid && isAreaValid
      })
   }

   /**
    * Retorna se a largura da classificação é válida
    * @param {object} classification A classificação em questão
    * @param {object} measure A medida em questão
    * @returns {boolean} Se é válida ou não
    */
   isClassificationPieceWidthValid(classification, measure) {
      if (this.isWidthInputHidden()) {
         return true
      }

      const minimumWidth = Number(classification.measures.minW ?? Number.NEGATIVE_INFINITY)
      const maximumWidth = Number(classification.measures.maxW ?? Number.POSITIVE_INFINITY)
      const isWidthValid = Utils.isInRange(minimumWidth, Number(measure.width), maximumWidth)

      return isWidthValid
   }

   /**
    * Retorna se a altura da classificação é válida
    * @param {object} classification A classificação em questão
    * @param {object} measure A medida em questão
    * @returns {boolean} Se é válida ou não
    */
   isClassificationPieceHeightValid(classification, measure) {
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumHeight = Number(classification.measures.minH ?? Number.NEGATIVE_INFINITY)
      const maximumHeight = Number(classification.measures.maxH ?? Number.POSITIVE_INFINITY)
      const isHeightValid = Utils.isInRange(minimumHeight, Number(measure.height), maximumHeight)

      return isHeightValid
   }

   /**
    * Retorna se a largura da classificação é válida
    * @param {object} classification A classificação em questão
    * @param {object} measure A medida em questão
    * @returns {boolean} Se é válida ou não
    */
   isClassificationPieceAreaValid(classification, measure) {
      if (this.isWidthInputHidden()) {
         return true
      }
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumArea = Number(classification.measures.minS ?? Number.NEGATIVE_INFINITY)
      const maximumArea = Number(classification.measures.maxS ?? Number.POSITIVE_INFINITY)
      const isHeightValid = Utils.isInRange(minimumArea, Number(measure.area), maximumArea)

      return isHeightValid
   }

   /**
    * Retorna todas as subclassificações para este produto
    * @returns {object[]} A lista de subclassificações
    */
   getSubclassifications() {
      return this.#resources.classifications.filter(classification => {
         return !this.isClassificationFatherless(classification)
      })
   }

   /**
    * Reotrna a lista de subclassificações válidas
    * @param {object} subclassifications A lista de subclassificações iniciais
    * @returns {object[]} A lista de subclassificações
    */
   getValidSubClassifications(subclassifications = this.getSubclassifications()) {
      return subclassifications
         .filter(subClassif => this.isSubclassificationValidByPiecesAmount(subClassif))
         .filter(subClassif => this.isSubclassificationValidByPiecesMeasures(subClassif))
   }

   /**
    * Retorna as subclassificações válidas para uma classificação
    * @param {number} classificationID O ID da classificação 
    * @returns {object[]} A lista de subclassificações
    */
   getValidSubclassificationsForClassification(classificationID) {
      return this.getValidSubClassifications().filter(subClassif => Number(subClassif.parent) === classificationID)
   }

   /**
    * Retorna se uma subclassificação é válida pela quantidade de peças
    * @param {object} subClassif A subclassificação
    * @returns {boolean} Se é válida ou não
    */
   isSubclassificationValidByPiecesAmount(subClassif) {
      return Number(subClassif.piece) === this.#dataCart.getMeasuresAmount()
   }

   /**
    * Retorna se uma subclassificação se encaixa nas medidas do produto
    * @param {object} subClassif A subclassificação em questão
    * @returns {boolean} Se é válida ou não
    */
   isSubclassificationValidByPiecesMeasures(subClassif) {
      return this.#dataCart.getMeasures().every(measure => {
         if (this.isBothMeasureInputsHidden()) {
            return true
         }

         const isWidthValid = this.isSubclassificationValidByPieceWidth(subClassif, measure) || !Number(subClassif.measures.maxW)
         const isHeightValid = this.isSubclassificationValidByPieceHeight(subClassif, measure) || !Number(subClassif.measures.maxH)
         const isAreaValid = this.isSubclassificationValidByPieceArea(subClassif, measure) || !Number(subClassif.measures.maxS)

         return isWidthValid && isHeightValid && isAreaValid
      })
   }

   /**
    * Retorna se uma subclassificação é válida pelas medidas de uma peça
    * @param {object} subClassif A subclassificação em questão 
    * @param {object} measure A medida em questão
    * @returns {boolean} Se é válida ou não
    */
   isSubclassificationValidByPieceWidth(subClassif, measure) {
      if (this.isWidthInputHidden()) {
         return true
      }

      const minimumWidth = Number(subClassif.measures.minW ?? Number.NEGATIVE_INFINITY)
      const maximumWidth = Number(subClassif.measures.maxW ?? Number.POSITIVE_INFINITY)
      const isWidthValid = Utils.isInRange(minimumWidth, Number(measure.width), maximumWidth)

      return isWidthValid
   }

   /**
    * Retorna se uma subclassificação é válida pelas medidas de uma peça
    * @param {object} subClassif A subclassificação em questão 
    * @param {object} measure A medida em questão
    * @returns {boolean} Se é válida ou não
    */
   isSubclassificationValidByPieceHeight(subClassif, measure) {
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumHeight = Number(subClassif.measures.minH ?? Number.NEGATIVE_INFINITY)
      const maximumHeight = Number(subClassif.measures.maxH ?? Number.POSITIVE_INFINITY)
      const isHeightValid = Utils.isInRange(minimumHeight, Number(measure.height), maximumHeight)

      return isHeightValid
   }

   /**
    * Retorna se uma subclassificação é válida pelas medidas de uma peça
    * @param {object} subClassif A subclassificação em questão 
    * @param {object} measure A medida em questão
    * @returns {boolean} Se é válida ou não
    */
   isSubclassificationValidByPieceArea(subClassif, measure) {
      if (this.isWidthInputHidden()) {
         return true
      }
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumArea = Number(subClassif.measures.minS ?? Number.NEGATIVE_INFINITY)
      const maximumArea = Number(subClassif.measures.maxS ?? Number.POSITIVE_INFINITY)
      const isAreaValid = Utils.isInRange(minimumArea, Number(measure.area), maximumArea)

      return isAreaValid
   }

   /**
    * Retorna todas as linhas disponíveis para este produto
    * @returns {object[]} A lista de linhas
    */
   getLines() {
      return this.#resources.lines
   }

   /**
    * Retorna as linhas válidas para esta montagem
    * @param {object[]} lines A lista de linhas para filtrar
    * @returns {object[]} As linhas válidas
    */
   getValidLines(lines = this.getLines()) {
      return lines
         .filter(line => this.isLineValidForCurrentModel(line))
         .filter(line => this.isLineValidForCurrentClassification(line))
         .filter(line => this.isLineValidForPieceMeasures(line))
   }

   /**
    * Retorna se a linha é válida para o modelo atual
    * @param {object} line A linha em questão
    * @returns {boolean} Se é válida ou não
    */
   isLineValidForCurrentModel(line) {
      return Number(line.modelID) === Number(this.#dataCart.getModel()?.id)
   }

   /**
    * Retorna se a linha é válida para a classificação atual
    * @param {object} line A linha em questão
    * @returns {boolean} Se é válida ou não
    */
   isLineValidForCurrentClassification(line) {
      const classification = this.#dataCart.getClassification()
      const allowedLines = Utils.parseNumbersString(classification?.line)

      if (!allowedLines.length) {
         return true
      }

      return allowedLines.includes(line.id)
   }

   /**
    * Retorna se a linha é válida para as medidas das peças
    * @param {object} line A linha em questão
    * @returns {boolean} Se é válida ou não
    */
   isLineValidForPieceMeasures(line) {
      return this.#dataCart.getMeasures().every(measure => {
         if (this.isBothMeasureInputsHidden()) {
            return true
         }

         const isWidthValid = this.isLineValidForPieceWidth(line, measure) || !Number(line.measures.maxW)
         const isHeightValid = this.isLineValidForPieceHeight(line, measure) || !Number(line.measures.maxH)
         const isAreaValid = this.isLineValidForPieceArea(line, measure) || !Number(line.measures.maxS)

         return isWidthValid && isHeightValid && isAreaValid
      })
   }

   /**
    * Retorna se a linha é válida para a medida de uma peça
    * @param {object} line A linha em questão 
    * @param {object} measure A medida em questão
    * @returns {boolean} Se a medida é válida 
    */
   isLineValidForPieceWidth(line, measure) {
      if (this.isWidthInputHidden()) {
         return true
      }

      const minimumWidth = Number(line.measures.minW ?? Number.NEGATIVE_INFINITY)
      const maximumWidth = Number(line.measures.maxW ?? Number.POSITIVE_INFINITY)
      const isWidthValid = Utils.isInRange(minimumWidth, Number(measure.width), maximumWidth)

      return isWidthValid
   }

   /**
    * Retorna se a linha é válida para a medida de uma peça
    * @param {object} line A linha em questão 
    * @param {object} measure A medida em questão
    * @returns {boolean} Se a medida é válida 
    */
   isLineValidForPieceHeight(line, measure) {
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumHeight = Number(line.measures.minH ?? Number.NEGATIVE_INFINITY)
      const maximumHeight = Number(line.measures.maxH ?? Number.POSITIVE_INFINITY)
      const isHeightValid = Utils.isInRange(minimumHeight, Number(measure.height), maximumHeight)

      return isHeightValid
   }

   /**
    * Retorna se a linha é válida para a medida de uma peça
    * @param {object} line A linha em questão 
    * @param {object} measure A medida em questão
    * @returns {boolean} Se a medida é válida 
    */
   isLineValidForPieceArea(line, measure) {
      if (this.isWidthInputHidden()) {
         return true
      }
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumArea = Number(line.measures.minS ?? Number.NEGATIVE_INFINITY)
      const maximumArea = Number(line.measures.maxS ?? Number.POSITIVE_INFINITY)
      const isAreaValid = Utils.isInRange(minimumArea, Number(measure.area), maximumArea)

      return isAreaValid
   }

   /**
    * Retorna se o campo de informações deve ser escondido
    * @returns {boolean} Se está escondido
    */
   isInformationSectionHidden() {
      return Boolean(this.getProductLayout().hideInformation)
   }

   /**
    * Retorna a garantia padrão do produto
    * @returns {object} A garantia padrão
    */
   getDefaultWarranty() {
      return this.getProductInformation().warranty
   }

   /**
    * Retorna as garantias disponíveis para este produto
    * @returns {object[]} A lista de garantias
    */
   getWarranties() {
      return this.#resources.warranties
   }

   /**
    * Retorna se há garantias adicionais
    * @returns {boolean} Se há garantias adicionais
    */
   hasAdditionalWarranties() {
      return this.getWarranties().length > 0
   }

   /**
  * Retorna os grupos do sistema
  * @returns {object[]} A lista de grupos
  */
   getGroups() {
      return this.#resources.groups
   }

   /**
    * Retorna o grupo pai de uma composição
    * @param {object} composition A composição
    * @returns {object | null} O grupo ou nulo caso nenhum id coincidir
    */
   getParentGroupForComposition(composition) {
      return this.getGroups()
         .find(group => group.id === composition.groupID)
   }

   /**
    * Retorna os grupos válidos para o carrinho
    * @param {object[]} groups A lista de grupos para filtrar
    * @returns {object[]} Os grupos válidos
    */
   getValidGroups(groups = this.getGroups()) {
      return groups
         .filter(group => this.isGroupValidByPiecesAmount(group))
         .filter(group => this.isGroupValidForModel(group))
   }

   /**
    * Retorna se um grupo é válido para a quantidade de medidas
    * @param {object} group O grupo em questão
    * @returns {boolean} Se é válido ou não
    */
   isGroupValidByPiecesAmount(group) {
      if (this.isBothMeasureInputsHidden()) {
         return true
      }

      return Number(group.piece) <= this.#dataCart.getMeasuresAmount()
   }

   /**
    * Retorna se um grupo é válido para o modelo atual escolhido
    * @param {object} group O grupo em questão
    * @returns {boolean} Se é válido ou não
    */
   isGroupValidForModel(group) {
      const groupModels = Utils.parseNumbersString(group.modelID)
      const hasModelParents = groupModels.length > 0

      if (!hasModelParents) {
         return true
      }

      return groupModels.includes(this.#dataCart.getModel()?.id)
   }

   /**
   * Retorna a lista de composições deste produto
   * @returns {object[]} A lista de componentes
   */
   getCompositions() {
      return this.#resources.compositions
   }

   /**
    * Retorna a composição de um grupo específico que bate com um ID
    * @param {number} groupID O ID do grupo
    * @param {number} compositionID O ID da composição
    * @returns {object | null} A composição que bate com o ID ou nulo
    */
   getCompositionFromGroupByID(groupID, compositionID) {
      return this.getCompositionsForGroup(groupID).find(composition => composition.id === compositionID)
   }

   /**
    * Retorna a composição pai de um opcional
    * @param {object} optional O opcional 
    * @returns {object | null} Retorna a composição pai
    */
   getParentCompositionForOptional(optional) {
      return this.getCompositionFromGroupByID(optional.groupID, optional.parent)
   }

   /**
    * Retorna a lista de composições váldias
    * @param {object[]} compositions As composições para serem filtradas
    * @returns {object[]} A lista de componentes
    */
   getValidCompositions(compositions = this.getCompositions()) {
      return compositions
         .filter(composition => this.isCompositionValidForCurrentModel(composition))
         .filter(composition => this.isCompositionValidForCurrentLine(composition))
         .filter(composition => this.isCompositionValidForCurrentClassification(composition))
   }

   /**
    * Retorna as composições de um grupo
    * @param {number} groupID O ID do grupo
    * @returns {object[]} A lista de composições
    */
   getCompositionsForGroup(groupID) {
      return this.getCompositions().filter(composition => Number(composition.groupID) === groupID)
   }

   /**
    * Retorna as composições válidas para um grupo
    * @param {number} groupID O ID do grupo
    * @returns {object[]} A lista de composições válidas
    */
   getValidCompositionsForGroup(groupID) {
      return this.getValidCompositions(this.getCompositionsForGroup(groupID))
   }

   /**
    * Retorna se a composição é válida para o modelo atual
    * @param {object} composition A composição em questão
    * @returns {boolean} Se é válida ou não 
    */
   isCompositionValidForCurrentModel(composition) {
      const allowedModels = Utils.parseNumbersString(composition.modelID)
      const hasModelRule = allowedModels.length > 0

      if (!hasModelRule) {
         return true
      }

      return allowedModels.includes(this.#dataCart.getModel()?.id)
   }

   /**
    * Retorna se a composição é válida para a linha atual
    * @param {object} composition A composição em questão
    * @returns {boolean} Se é válida ou não 
    */
   isCompositionValidForCurrentLine(composition) {
      const allowedLines = Utils.parseNumbersString(composition.lineID)
      const hasLineRule = allowedLines.length > 0

      if (!hasLineRule) {
         return true
      }

      return allowedLines.includes(this.#dataCart.getLine()?.id)
   }

   /**
    * Retorna se a composição é válida para a classficação atual
    * @param {object} composition A composição em questão
    * @returns {boolean} Se é válida ou não 
    */
   isCompositionValidForCurrentClassification(composition) {
      const allowedClassifications = Utils.parseNumbersString(composition.modelClassifID)
      const hasClassificationRule = allowedClassifications.length > 0

      if (!hasClassificationRule) {
         return true
      }

      return allowedClassifications.includes(this.#dataCart.getClassification()?.id)
   }

   /**
    * Retorna as composições visíveis para um grupo
    * @param {number} groupID O ID do grupo
    * @returns {object[]} A lista de composições válidas
    */
   getVisibleCompositionsForGroup(groupID) {
      return this.getValidCompositionsForGroup(groupID)
         .filter(composition => !this.isCompositionConfirmed(composition))
         .filter(composition => this.isCompositionVisibleAfterRuleChecks(composition))
   }

   /**
    * Retorna se uma composição já foi confirmada
    * @param {object} composition A composição 
    * @returns {boolean} Se já foi confirmada ou não
    */
   isCompositionConfirmed(composition) {
      return this.#dataCart.getConfirmedOptionsForGroup(composition.groupID).some(option => {
         return option.categoryID === composition.categoryID
      })
   }

   /**
    * Retorna se um opcional está confirmado
    * @param {object} optional O opcional em questão 
    * @returns {boolean} Se está confirmado ou não
    */
   isOptionalConfirmed(optional) {
      return this.#dataCart.getConfirmedOptionsForGroup(optional.groupID).some(option => {
         if (option.type === 'input') {

            return option.componentID === optional.id

         } else {

            return option.id === optional.id

         }
      })
   }

   /**
    * Retorna se uma composição vai estar visível depois das checagem das regras
    * @param {object} composition A composição em questão
    * @returns {boolean} Se vai estar visível ou não
    */
   isCompositionVisibleAfterRuleChecks(composition) {
      const isVisibleByDefault = !composition.hiddenComponent
      const ruleGroups = this.getRuleGroupsForComposition(composition.categoryID)

      if (!this.isCompositionWithRules(composition)) {
         return isVisibleByDefault
      }

      const ruleResults = Ruler.checkAllRuleGroups(ruleGroups, this.#dataCart)
      const validRule = ruleResults.find(ruleResult => ruleResult.isValid)

      const checkedGroupsInformation = ruleResults.map(ruleGroup => ({
         ...ruleGroup,
         from: composition.title,
         groupID: composition.groupID,
         source: Ruler.SOURCES.COMPOSITION,
         compositionID: composition.id
      }))


      this.#checkedCompositionRules.push(...checkedGroupsInformation)

      if (!validRule) {
         return isVisibleByDefault
      }

      return validRule.action === Ruler.ACTIONS.SHOW
   }

   /**
    * Retorna se tem uma mensagem de regra para esta composição
    * @param {number} compositionID O id da composião
    * @returns {boolean} Se tem uma mensagem para a composição
    */
   hasRuleMessageForComposition(compositionID) {
      return Boolean(
         this.getValidCheckedRulesForComposition(compositionID)
            .filter(ruleGroup => Boolean(ruleGroup.message))
            .length
      )
   }

   hasRuleMessageForOptional(optionalID) {
      return Boolean(
         this.getValidCheckedRulesForOptional(optionalID)
            .filter(ruleGroup => Boolean(ruleGroup.message))
            .length
      )
   }

   getValidCheckedRulesForOptional(optionalID) {
      return this.#checkedOptionalRules.filter(ruleGroup => {
         return ruleGroup.isValid && ruleGroup.optionalID === optionalID
      })
   }

   /**
    * Retornas as regras válidas checadas para estas composições
    * @param {number} compositionID O ID da composição
    * @returns {object | null} O grupo de regras 
    */
   getValidCheckedRulesForComposition(compositionID) {
      return this.#checkedCompositionRules.filter(ruleGroup => {
         return ruleGroup.isValid && ruleGroup.compositionID === compositionID
      })
   }

   /**
    * Retorna se é uma composição com grupos de regras
    * @param {object} composition A composição 
    * @returns {boolean} Retorna se a composição possui regras
    */
   isCompositionWithRules(composition) {
      return this.getRuleGroupsForComposition(composition.categoryID).length > 0
   }

   /**
    * Retorna os grupos de regras das composições
    * @returns {object[]} Os grupos de regras
    */
   getCompositionRuleGroups() {
      return this.#resources.compositionRules
   }

   /**
    * Retorna os gurpos de regra para um componente em específico
    * @param {number} categoryID O ID da categoria do componente
    * @returns {object[]} A lista de regras para este componente
    */
   getRuleGroupsForComposition(categoryID) {
      return this.getCompositionRuleGroups().filter(ruleGroup => ruleGroup.categoryID === categoryID)
   }

   /**
    * Retorna a opção padrão para uma composição
    * @param {object} composition A composição
    * @returns {object | null} O objeto
    */
   getDefaultOptionForComposition(composition) {
      return this.getVisibleOptionalsForComposition(composition).find(optional => {
         return Boolean(+optional.defaultSelection)
      })
   }

   /**
    * Retorna as regras de grupo dos opcionais
    * @returns {object[]} A lista de regras
    */
   getOptionalsRuleGroups() {
      return this.#resources.optionalRules
   }

   /**
    * Retorna as regras de grupo para um opcional em específico
    * @param {number} optionID O ID do opcional
    * @returns {object[]} A lista de regras
    */
   getRuleGroupsForOptional(optionID) {
      return this.getOptionalsRuleGroups()
         .filter(ruleGroup => ruleGroup.optionID === optionID)
   }

   /**
    * Retorna os opcionais do produto
    * @returns {object[]} A lista de opcionais para o produto
    */
   getOptionals() {
      return this.#resources.optionals
         .filter(optional => !this.isOptionalFatherless(optional))
   }

   /**
    * Retorna se um opcional não tem um pai
    * @param {object} optional O opcional em questão 
    * @returns {boolean} Se tem um pai ou não
    */
   isOptionalFatherless(optional) {
      return !optional.parent
   }

   /**
    * Retorna os opcionais válidos
    * @param {object[]} optionals A lista de opcionais para filtrar
    * @returns {object[]} A lista de opcionais válidos
    */
   getValidOptionals(optionals = this.getOptionals()) {
      // console.log("optionals");
      // console.log(optionals);

      return optionals
         .filter(optional => this.isOptionalValidForCurrentLine(optional))
         .filter(optional => this.isOptionalValidForCurrentModel(optional))
         .filter(optional => this.isOptionalValidForCurrentClassification(optional))
         .filter(optional => this.isOptionalValidForTotalMeasures(optional))
         .filter(optional => this.isOptionalValidForPiecesMeasures(optional))
         .filter(optional => this.isOptionalValidForProportionRules(optional))
   }

   /**
    * Retorna um opcional pai de uma combinação em específico
    * @param {object} combination A combinação em específico
    * @returns {object | null} O opcional pai em questão
    */
   getParentOptionalForCombination(combination) {
      return this.getOptionals().find(optional => optional.id === combination.parent)
   }

   /**
    * Retorna se um opcional é válido para suas regras de proporção
    * @param {object} optional O opcional em si
    * @returns {boolean} Se é válido para as regras de proporção 
    */
   isOptionalValidForProportionRules(optional) {
      const proportionRules = optional.proportionRules ?? []
      const hasRule = proportionRules.length > 0

      if (!hasRule) {
         return true
      }

      return proportionRules.some(proportionRule => this.isOptionalProportionRuleValid(proportionRule))
   }

   /**
    * Retorna se uma regra de proporção de um opcional é válida
    * @param {object} proportionRule A regra de proporção
    * @returns {boolean} Se é válida 
    */
   isOptionalProportionRuleValid(proportionRule) {
      const allowedModels = Utils.parseNumbersString(proportionRule.model)
      const hasModelRule = allowedModels.length > 0

      const isModelValid = !hasModelRule || allowedModels.includes(this.#dataCart.getModel()?.id)
      const isMeasureValid = this.isProportionRuleMeasuresValid(proportionRule)

      return isModelValid && isMeasureValid
   }

   /**
    * Retorna se as regras de medida de uma regra de proporção é válida
    * @param {object} proportionRule A regra de proporção
    * @returns {boolean} Se a regra é válida
    */
   isProportionRuleMeasuresValid(proportionRule) {

      const isWidthRule = Number(proportionRule.type) === 1
      const isHeightRule = Number(proportionRule.type) === 2

      const meas1d = Number(proportionRule.meas1d)
      const meas1a = Number(proportionRule.meas1a)
      const meas2d = Number(proportionRule.meas2d)
      const meas2a = Number(proportionRule.meas2a)

      //Verifica se a medida1 é altura ou a largura (1 = larg)
      if (isWidthRule) {
         return this.#dataCart.getMeasures().every(measure => {
            const isWidhtValid = Utils.isInRange(meas1d, measure.width, meas1a)
            const isHeightValid = Utils.isInRange(meas2d, measure.height, meas2a)

            return isWidhtValid && isHeightValid
         })
      }

      //Verifica se a medida1 é altura ou a largura (2 = alt)
      if (isHeightRule) {
         return this.#dataCart.getMeasures().every(measure => {
            const isWidthValid = Utils.isInRange(meas2d, measure.width, meas2a)
            const isHeightValid = Utils.isInRange(meas1d, measure.height, meas1a)

            return isWidthValid && isHeightValid
         })
      }
   }

   /**
    * Retorna se o opcional é válido para as medidas totais da montagem
    * @param {object} optional opcional em questão
    * @returns {boolean} Se é válido ou não
    */
   isOptionalValidForTotalMeasures(optional) {
      if (this.isBothMeasureInputsHidden()) {
         return true
      }
      if (this.isOptionalIgnoringTotalMeasuresVerification(optional)) {
         return true
      }

      const isWidthValid = this.isOptionalValidForTotalWidth(optional) || !Number(optional.maxW)
      const isHeightValid = this.isOptionalValidForTotalHeight(optional) || !Number(optional.maxH)
      const isAreaValid = this.isOptionalValidForTotalArea(optional) || !Number(optional.maxS)

      return isWidthValid && isHeightValid && isAreaValid
   }

   /**
    * Retorna se um opcional é válido para as medidas totais de largura
    * @param {object} optional O opcional em questão 
    * @returns {boolean} Se é válido ou não
    */
   isOptionalValidForTotalWidth(optional) {
      if (this.isWidthInputHidden()) {
         return true
      }

      const minimumWidth = Number(optional.minW ?? Number.NEGATIVE_INFINITY)
      const maximumWidth = Number(optional.maxW ?? Number.POSITIVE_INFINITY)
      const isWidthValid = Utils.isInRange(minimumWidth, this.#dataCart.getTotalWidth(), maximumWidth)

      return isWidthValid
   }

   /**
    * Retorna se um opcional é válido para as medidas totais de altura
    * @param {object} optional O opcional em questão 
    * @returns {boolean} Se é válido ou não
    */
   isOptionalValidForTotalHeight(optional) {
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumHeight = Number(optional.minH ?? Number.NEGATIVE_INFINITY)
      const maximumHeight = Number(optional.maxH ?? Number.POSITIVE_INFINITY)
      const isHeightValid = Utils.isInRange(minimumHeight, this.#dataCart.getTotalHeight(), maximumHeight)

      return isHeightValid
   }

   /**
    * Retorna se um opcional é válido para as medidas totais de area
    * @param {object} optional O opcional em questão 
    * @returns {boolean} Se é válido ou não
    */
   isOptionalValidForTotalArea(optional) {
      if (this.isWidthInputHidden()) {
         return true
      }
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumArea = Number(optional.minS ?? Number.NEGATIVE_INFINITY)
      const maximumArea = Number(optional.maxS ?? Number.POSITIVE_INFINITY)
      const isAreaValid = Utils.isInRange(minimumArea, this.#dataCart.getTotalArea(), maximumArea)

      return isAreaValid
   }

   /**
    * Retorna se um opcional é válido pelas medidas de peças
    * @param {object} optional O opcional em questão
    * @returns {boolean} Se é válido ou não
    */
   isOptionalValidForPiecesMeasures(optional) {
      return this.#dataCart.getMeasures().every(measure => {
         if (this.isBothMeasureInputsHidden()) {
            return true
         }
         if (this.isOptionalIgnoringPiecesMeasuresVerification(optional)) {
            return true
         }

         const isWidthValid = this.isOptionalValidForPieceWidth(optional, measure) || !Number(optional.maxWP)
         const isHeightValid = this.isOptionalValidForPieceHeight(optional, measure) || !Number(optional.maxHP)
         const isAreaValid = this.isOptionalValidForPieceArea(optional, measure) || !Number(optional.maxSP)

         return isWidthValid && isHeightValid && isAreaValid
      })
   }

   /**
    * Retorna se um opcional é válido para a medida de largura de uma peça
    * @param {object} optional O opcional em questão
    * @param {object} measure A medida em questão
    * @returns {boolean} Se é válido ou não
    */
   isOptionalValidForPieceWidth(optional, measure) {
      if (this.isWidthInputHidden()) {
         return true
      }

      const minimumWidth = Number(optional.minWP ?? Number.NEGATIVE_INFINITY)
      const maximumWidth = Number(optional.maxWP ?? Number.POSITIVE_INFINITY)
      const isWidthValid = Utils.isInRange(minimumWidth, measure.width, maximumWidth)

      return isWidthValid
   }

   /**
    * Retorna se um opcional é válido para a medida de altura de uma peça
    * @param {object} optional O opcional em questão
    * @param {object} measure A medida em questão
    * @returns {boolean} Se é válido ou não
    */
   isOptionalValidForPieceHeight(optional, measure) {
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumHeight = Number(optional.minHP ?? Number.NEGATIVE_INFINITY)
      const maximumHeight = Number(optional.maxHP ?? Number.POSITIVE_INFINITY)
      const isHeightValid = Utils.isInRange(minimumHeight, measure.height, maximumHeight)

      return isHeightValid
   }

   /**
    * Retorna se um opcional é válido para a medida de altura de uma peça
    * @param {object} optional O opcional em questão
    * @param {object} measure A medida em questão
    * @returns {boolean} Se é válido ou não
    */
   isOptionalValidForPieceArea(optional, measure) {
      if (this.isWidthInputHidden()) {
         return true
      }
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimumArea = Number(optional.minSP ?? Number.NEGATIVE_INFINITY)
      const maximumArea = Number(optional.maxSP ?? Number.POSITIVE_INFINITY)
      const isAreaValid = Utils.isInRange(minimumArea, measure.area, maximumArea)

      return isAreaValid
   }

   /**
    * Retorna se um opcional está ignorando a verificação de medidas totais
    * @param {object} optional O opcional em questão 
    * @returns {boolean} Se está ignorando
    */
   isOptionalIgnoringTotalMeasuresVerification(optional) {
      return Boolean(optional.measures.ignoreTotalMeasures)
   }

   /**
    * Retorna se um opcional está ignorando a verificação de medidas das peças
    * @param {object} optional O opcional em questão 
    * @returns {boolean} Se está ignorando
    */
   isOptionalIgnoringPiecesMeasuresVerification(optional) {
      return Boolean(optional.measures.ignorePieceMeasures)
   }

   /**
    * Retorna se um opcional é válido para a linha atual
    * @param {object} optional O opcional em questão
    * @returns {boolean} Se é válido
    */
   isOptionalValidForCurrentLine(optional) {
      if (!optional.lineID) {
         return true
      }

      return Number(optional.lineID) === this.#dataCart.getLine()?.id
   }

   /**
    * Retorna se um opcional é válido para o modelo atual
    * @param {object} optional O opcional em questão
    * @returns {boolean} Se é válido
    */
   isOptionalValidForCurrentModel(optional) {
      const allowedModels = Utils.parseNumbersString(optional.modelID)
      const hasModelRule = allowedModels.length > 0

      if (!hasModelRule) {
         return true
      }

      return allowedModels.includes(this.#dataCart.getModel()?.id)
   }

   /**
    * Retorna se um opcional é válido para a classificação atual
    * @param {object} optional O opcional em questão
    * @returns {boolean} Se é válido
    */
   isOptionalValidForCurrentClassification(optional) {
      const allowedClassifications = Utils.parseNumbersString(optional.modelClassID)
      const hasClassificationRule = allowedClassifications.length > 0

      // console.log(optional);

      if (!hasClassificationRule) {
         // console.log("Nulo");

         return true
      }

      // console.log("Passou");


      return allowedClassifications.includes(this.#dataCart.getClassification()?.id)
   }

   /**
    * Retorna os opcionais para uma composição
    * @param {object} composition A composição 
    * @returns {object[]} A lista de opcionais 
    */
   getOptionalsForComposition(composition) {

      // console.log("composition");
      // console.log(composition);


      return this.getOptionals()
         .filter(optional => optional.parent === composition.id)
         .filter(optional => optional.categoryID === composition.categoryID)
         .filter(optional => optional.groupID === composition.groupID)
   }

   /**
    * Retorna os opcionais válidos para uma composição
    * @param {object} composition A composição em questão 
    * @returns {object[]} A lista de opcionais
    */
   getValidOptionalsForComposition(composition) {
      // console.log(composition);
      // console.log(this.getOptionalsForComposition(composition));
      // console.log(this.getValidOptionals(this.getOptionalsForComposition(composition)));

      return this.getValidOptionals(this.getOptionalsForComposition(composition))
   }

   /**
    * Retorna os opcionais visíveis para uma composição
    * @param {object} composition A composição em questão
    * @returns {object[]} A lista de opcionais 
    */
   getVisibleOptionalsForComposition(composition) {
      return this.getValidOptionalsForComposition(composition)
         .filter(optional => !this.isOptionalConfirmed(optional))
         .filter(optional => this.isOptionalVisibleAfterRuleChecks(optional))
   }

   /**
    * Retorna um opcional de uma opção confirmada
    * @param {object} option A opção confirmada 
    * @returns {object | null} O opcional ou nulo caso não econtrar
    */
   getOptionalForConfirmedOption(option) {
      if (option.type !== 'input') {
         return option
      }

      const parentCombination = this.getParentCombinationForCommodity(option)
      const parentOptional = this.getParentOptionalForCombination(parentCombination)

      return parentOptional
   }

   /**
    * Retorna se um opcional está visível depois de uma checagem de regras
    * @param {object} optional O opcional
    * @returns {boolean} Se está visível ou não 
    */
   isOptionalVisibleAfterRuleChecks(optional) {

      const isVisibleByDefault = true
      const ruleGroups = this.getRuleGroupsForOptional(optional.id)

      if (ruleGroups.length === 0) {
         return isVisibleByDefault
      }

      const ruleResults = Ruler.checkAllRuleGroups(ruleGroups, this.#dataCart)
      const validRule = ruleResults.find(ruleResult => ruleResult.isValid)

      const checkedGroupsInformation = ruleResults.map(ruleGroup => ({
         ...ruleGroup,
         from: optional.title,
         groupID: optional.groupID,
         source: Ruler.SOURCES.OPTIONAL,
         optionalID: optional.id
      }))

      this.#checkedOptionalRules.push(...checkedGroupsInformation)

      if (!validRule) {
         return isVisibleByDefault
      }

      return validRule.action === Ruler.ACTIONS.SHOW
   }

   /**
    * Retorna a lista de formulários presentes nesse produto
    * @returns {object[]} A lista de formulários
    */
   getForms() {
      return this.#resources.forms
   }

   /**
    * Retorna os formulários pertencentes a um opcional
    * @param {number} optionalID O ID do opcional 
    * @returns {object[]} O lista de opcionais para este produt
    */
   getFormsForOptional(optionalID) {
      return this.getForms().filter(form => form.parent === optionalID)
   }

   /**
    * Retorna a lista de ambientes disponíveis
    * @returns {object[]} A lista de ambientes
    */
   getEnvironments() {
      return this.#resources.environments
   }

   /**
    * Retorna as combinações deste produto
    * @returns {object[]} A lista de combinações
    */
   getCombinations() {
      return this.#resources.combinations
   }

   /**
    * Retorna a lista de combinações para um opcional
    * @param {number} optionalID O ID do opcional 
    * @returns {object[]} A lista de combinações para este opcional
    */
   getCombinationsForOptional(optionalID) {
      return this.getCombinations().filter(combination => combination.parent === optionalID)
   }

   /**
    * Retorna a combinação pai para um insumo em específico
    * @param {object} commodity O insumo em si
    * @returns {object | null} A combinação ou nulo
    */
   getParentCombinationForCommodity(commodity) {
      return this.getCombinations().find(combination => combination.id === commodity.parent)
   }

   /**
    * Retorna todos os insumos que podem ser selecionados
    * @returns {object[]} A lista de insumos
    */
   getCommodities() {
      return this.#resources.commodities
   }

   /**
    * Retorna todos os insumos para uma combinação
    * @param {number} combinationID O ID de uma combinação 
    * @returns {object[]} A lista de insumos para esta combinação
    */
   getCommoditiesForCombination(combinationID) {
      return this.getCommodities().filter(commodity => commodity.parent === combinationID)
   }

   /**
    * Retorna todos os insumos válidos para uma combinação
    * @param {number} combinationID O ID de uma combinação 
    * @returns {object[]} A lista de insumos válidos para esta combinação
    */
   getValidCommoditiesForCombination(combinationID) {
      return this.getValidCommodities(this.getCommoditiesForCombination(combinationID))
   }

   /**
    * Retorna os insumos válidos a partir de um grupo de insumos
    * @param {object[]} commodities Os insumos para serem filtrados inicialmente 
    * @returns {object[]} Os insumos válidos
    */
   getValidCommodities(commodities = this.getCommodities()) {
      return commodities
         .filter(commodity => this.isCommodityValidForCurrentLine(commodity))
         .filter(commodity => this.isCommodityValidForTotalMeasures(commodity))
   }

   /**
    * Retorna se um insumo é válido para a linha atual
    * @param {object} commodity O insumo em questão
    * @returns {boolean} Se é válido 
    */
   isCommodityValidForCurrentLine(commodity) {
      const allowedLines = Utils.parseNumbersString(commodity.lines)
      const hasLineRule = allowedLines.length > 0

      if (!hasLineRule) {
         return true
      }

      return allowedLines.includes(this.#dataCart.getLine()?.id)
   }

   /**
    * Retorna se um insumo é válido para as medidas totais do produto
    * @param {object} commodity O insumo em questão
    * @returns {boolean} Se é válido 
    */
   isCommodityValidForTotalMeasures(commodity) {
      if (this.isBothMeasureInputsHidden()) {
         return true
      }

      const isWidthValid = this.isCommodityValidForTotalWidth(commodity) || !Number(commodity.measures.maxW)
      const isHeightValid = this.isCommodityValidForTotalHeight(commodity) || !Number(commodity.measures.maxH)
      const isAreaValid = this.isCommodityValidForTotalArea(commodity) || !Number(commodity.measures.maxS)

      return isWidthValid && isHeightValid && isAreaValid
   }

   /**
    * Retorna se um insumo é válido para as medidas totais de largura
    * @param {object} commodity O insumo em questão 
    * @returns {boolean} Se é válido ou não
    */
   isCommodityValidForTotalWidth(commodity) {
      if (this.isWidthInputHidden()) {
         return true
      }

      const minimunWidth = Number(commodity.measures.minW ?? Number.NEGATIVE_INFINITY)
      const maximumWidth = Number(commodity.measures.maxW ?? Number.POSITIVE_INFINITY)
      const isWidthValid = Utils.isInRange(minimunWidth, this.#dataCart.getTotalWidth(), maximumWidth)

      return isWidthValid
   }

   /**
    * Retorna se um insumo é válido para as medidas totais de altura
    * @param {object} commodity O insumo em questão 
    * @returns {boolean} Se é válido ou não
    */
   isCommodityValidForTotalArea(commodity) {
      if (this.isWidthInputHidden()) {
         return true
      }
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimunArea = Number(commodity.measures.minS ?? Number.NEGATIVE_INFINITY)
      const maximumArea = Number(commodity.measures.maxS ?? Number.POSITIVE_INFINITY)
      const isAreaValid = Utils.isInRange(minimunArea, this.#dataCart.getTotalArea(), maximumArea)

      return isAreaValid
   }

   /**
    * Retorna se um insumo é válido para as medidas totais de área
    * @param {object} commodity O insumo em questão 
    * @returns {boolean} Se é válido ou não
    */
   isCommodityValidForTotalHeight(commodity) {
      if (this.isHeightInputHidden()) {
         return true
      }

      const minimunHeight = Number(commodity.measures.minH ?? Number.NEGATIVE_INFINITY)
      const maximumHeight = Number(commodity.measures.maxH ?? Number.POSITIVE_INFINITY)
      const isHeightValid = Utils.isInRange(minimunHeight, this.#dataCart.getTotalHeight(), maximumHeight)

      return isHeightValid
   }

   /**
    * Retorna se o opcional é um opcional que esconde opções
    * @param {object} optional O opcional em questão 
    * @returns {boolean} Se é um opcional que esconde suas combinações
    */
   isOptionalWithHiddenCombinations(optional) {
      return Boolean(optional.options.hideCombinations)
   }

   /**
    * Retorna se é um opcional com um nível escondido
    * @param {object} optional O opcional em questão 
    * @returns {boolean} Se esconde seus níveis ou não
    */
   isOptionalWithHiddenLevel(optional) {
      return Boolean(optional.options.hideLevel)
   }

   /**
    * Retorna se um opcional não possui combinações
    * @param {object} optional O opcional 
    * @returns {boolean} Se não tem combinações
    */
   isOptionalWithoutCombinations(optional) {
      return this.getCombinationsForOptional(optional.id).length === 0
   }

   /**
    * Retorna se é um opcional com formulários disponiveis
    * @param {object} optional O opcional em questão
    * @returns {boolean} Se tem formulários para este opcional 
    */
   isOptionalWithForms(optional) {
      return this.getFormsForOptional(optional.id).length > 0
   }

   /**
    * Retorna a combinação optima para um opcional
    * @param {object} optional O opcional em questão 
    * @returns {object | null} A combinação optima ou nulo
    */
   getOptimalCombinationForOptional(optional) {
      const combinations = this.getOptionalCombinationsForColorAutomatic(optional)
      const dependents = this.getOptionalDependents(optional)
      const optimalCombination = this.decideOptimalColorCombination(dependents, combinations)

      return optimalCombination
   }

   /**
    * Retorna a lista de combinações sortidas para aplicar o tratamento de cor automática
    * @param {object} optional O opcional 
    * @returns {object[]} A lista de combinações
    */
   getOptionalCombinationsForColorAutomatic(optional) {
      return Utils.sortAlphabeticaly(this.getCombinationsForOptional(optional.id), 'title')
   }

   /**
    * Retorna se o opcional está com o tratamento de cores automáticas ligadas
    * @param {object} optional O opcional em questão
    * @returns {boolean} Se está ativado ou não
    */
   isOptionalColorAutomaticOn(optional) {
      return Boolean(+optional.associatedColor) && Boolean(+optional.autoSelection)
   }

   /**
    * Retorna os opcionais dependentes presentes na montagem
    * @param {object} optional O opcional
    * @returns {object[]} A lista de opcionais
    */
   getOptionalDependents(optional) {
      const dependentIDS = Utils.parseNumbersString(optional.dependentID)
      const dependents = this.#dataCart.getConfirmedOptions().filter(option => {
         const composition = this.getConfirmedOptionComposition(option)
         const isDependent = dependentIDS.includes(composition.id)

         return isDependent
      })

      return dependents
   }

   /**
    * Retorna a composição pai de uma opção
    * @param {object} option A opção confirmada do carrinho 
    * @returns {object} A composição pai 
    */
   getConfirmedOptionComposition(option) {
      if (option.type === 'input') {

         const parentCombination = this.getParentCombinationForCommodity(option)
         const parentOptional = this.getParentOptionalForCombination(parentCombination)
         const parentComposition = this.getParentCompositionForOptional(parentOptional)

         return parentComposition

      } else {

         return this.getParentCompositionForOptional(option)

      }
   }

   /**
   * Retorna se tem opções visíveis em um grupo
   * @param {number} groupID O ID do grupo em questão 
   * @returns {boolean} Se tem ou não opções visíveis
   */
   hasVisibleCompositionsInGroup(groupID) {
      return Boolean(this.getVisibleCompositionsForGroup(groupID).length)
   }

   /**
    * Retorna a cor optima para usar na seleção automática de cor
    * @param {object} dependents Os dependentes de uma opção 
    * @param {object[]} combinations As combinações desta opção
    * @returns {object | null} A combinação a ser usada
    */
   decideOptimalColorCombination(dependents, combinations) {
      const defaultCombination = combinations.find(combination => {
         return Boolean(combination.isDefaultSelected)
      })

      let primaryColorCombinationMatch
      let secondaryColorCombinationMatch

      for (const dependent of dependents.reverse()) {
         primaryColorCombinationMatch = combinations.find(combination => {
            const combinationColorID = combination.primaryColor
            const dependentColorID = dependent.selectedColorID

            return combinationColorID === dependentColorID
         })

         secondaryColorCombinationMatch = combinations.find(combination => {
            const combinationSecondaryColors = Utils.parseNumbersString(combination.secondaryColors)
            const dependentColorID = dependent.selectedColorID

            return combinationSecondaryColors.includes(dependentColorID)
         })

         if (primaryColorCombinationMatch) {
            break
         }
         if (secondaryColorCombinationMatch) {
            break
         }
      }

      return primaryColorCombinationMatch ?? secondaryColorCombinationMatch ?? defaultCombination ?? combinations[0]
   }

   /**
    * Limpa a lista de checagem de regra das composições
    */
   clearCompositionRuleChecks() {
      this.#checkedCompositionRules = []
   }

   /**
    * Limpa a lista de checagem de regra dos opcionais
    */
   clearOptionalRuleChecks() {
      this.#checkedOptionalRules = []
   }

   /**
    * Retorna a lista de regras das composições aplicadas
    * @returns {object[]} As checagens das composições
    */
   getCompositionRuleChecks() {
      return this.#checkedCompositionRules
   }

   /**
    * Retorna a lista de regras dos opcionais aplicadas
    * @returns {object[]} As checagens dos opcionais
    */
   getOptionalRuleChecks() {
      return this.#checkedOptionalRules
   }
}