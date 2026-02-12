import APIManager from '../api/APIManager.js'
import Utils from '../core/Utils.js'
import DataCart from './DataCart.js'
import FormulaParser from './FormulaParser.js'
import Ruler from './Ruler.js'
import { STORAGE_URL } from '../api/Variables.js'
import { AssemblyCoordinator } from './AssemblyCoordinator.js'
import { ResourceNamesProvider } from './resources/ResourcesNamesProvider.js'

export default class Datasheet {

   static cachedData = new Map()
   static validatorResults = []
   static lastVariables = {}

   /**
    * Tenta processar um carrinho e retornar a Ficha Técnica do mesmo 
    * @param {DataCart} dataCart O produto 
    */
   static async process(dataCart, data) {
      const [names, validators, inputs, formulas] = await Datasheet.fetchAndCacheData(dataCart.getProductID())

      if (!names) {
         console.warn('(Ficha Técnica) Sem arquivo de nome dos insumos.')
         return []
      }

      if (!validators) {
         console.warn('(Ficha Técnica) Sem arquivo dos validadores.')
         return []
      }

      if (!inputs) {
         console.warn('(Ficha Técnica) Sem arquivo de insumos.')
         return []
      }

      if (!formulas) {
         console.warn('(Ficha Técnica) Sem arquivos de fórmulas.')
         return []
      }

      Datasheet.lastVariables = { ...Datasheet.lastVariables, ...dataCart.getVariables() }

      return Datasheet.assimilate(dataCart, names, validators, inputs, formulas, data)
   }

   /**
    * Retorna os dados da ficha técnica com os insumos assimildaos
    * É aplicado as fórmulas e nomes nestes istems 
    * @param {DataCart} dataCart O carrinho
    * @param {Record<string, string>} names A lista de nomes dos insumos
    * @param {object[]} validators A lista de validadores
    * @param {object[]} inputs A lista de insumos
    * @param {object[]} formulas as formulas
    * @param {object} data Os dados da montagem
    */
   static assimilate(

      dataCart,
      names,
      validators,
      inputs,
      formulas,
      data

   ) {

      Datasheet.validatorResults = []
      Datasheet.lastVariables = { ...Datasheet.lastVariables }

      const inputWithNames = inputs.map(input => Datasheet.applyName(input, names))
      const validInputs = inputWithNames.filter(input => Datasheet.isInputValid(input, validators, dataCart, names))
      const inputsWithInfo = validInputs.map(input => Datasheet.applyRelatedInfo(input, dataCart, data))
      const inputsWithFormulas = inputsWithInfo.flatMap(input => Datasheet.cloneInputWithFormulas(input, validators, formulas, dataCart, Datasheet.lastVariables))

      return inputsWithFormulas
   }

   /**
    * Retorna se um insumo é válido (Está aplicado)
    * Verifica se há um grupo no carrinho que bate com o insumo
    * Verifica se os validadores são válidos
    * Verifica se há uma relação com uma composição do carrinho 
    * @param {object} input O insumo atual 
    * @param {object[]} validators A lista de validadores
    * @param {DataCart} dataCart O carrinho
    * @param {Record<string, string>} names A lista de nomes dos insumos
    * @param {boolean} useFastMode Se deve usar o modo rápido     
    */
   static isInputValid(input, validators, dataCart, names) {

      if (!Datasheet.isGroupValid(input, dataCart)) return false
      if (!Datasheet.isInputRelationValid(input, dataCart)) return false
      if (!Datasheet.isMeasuresValid(input, dataCart)) return false
      if (!Datasheet.isValidatorsValid(input, validators, dataCart, names)) return false

      return true
   }

   /**
    * Retorna se o insumo é valido para as medidas
    * @param {object} input O insumo
    * @param {DataCart} dataCart O carrinho  
    */
   static isMeasuresValid(input, dataCart) {

      const isValidByTotal = Datasheet.isTotalMeasuresValid(input, dataCart)
      const isValidByPiece = Datasheet.isPiecesMeasuresValid(input, dataCart)

      return isValidByTotal && isValidByPiece
   }

   /**
    * Retorna se as medidas por peça são válidas
    * @param {object} input O insumo
    * @param {DataCart} dataCart O carrinho  
    */
   static isPiecesMeasuresValid(input, dataCart) {
      return dataCart.getMeasures().every(measure => {

         const isValidByWidth = (Number(input.minWP ?? -Infinity) <= measure.width) && (measure.width <= Number(input.maxWP ?? Infinity))
         const isValidByHeight = (Number(input.minHP ?? -Infinity) <= measure.height) && (measure.height <= Number(input.maxHP ?? Infinity))
         const isValidByArea = (Number(input.minSP ?? -Infinity) <= measure.area) && (measure.area <= Number(input.maxSP ?? Infinity))

         return isValidByWidth && isValidByHeight && isValidByArea

      })
   }

   /**
    * Retorna se o insumo é válido para a medida de um carrinho
    * @param {object} input O insumo
    * @param {DataCart} dataCart O carrinho  
    */
   static isTotalMeasuresValid(input, dataCart) {

      const isValidByWidth = (Number(input.minW ?? -Infinity) <= dataCart.getTotalWidth()) && (dataCart.getTotalWidth() <= Number(input.maxW ?? Infinity))
      const isValidByHeight = (Number(input.minH ?? -Infinity) <= dataCart.getTotalHeight()) && (dataCart.getTotalHeight() <= Number(input.maxH ?? Infinity))
      const isValidByArea = (Number(input.minS ?? -Infinity) <= dataCart.getTotalArea()) && (dataCart.getTotalArea() <= Number(input.maxS ?? Infinity))

      return isValidByWidth && isValidByHeight && isValidByArea
   }

   /**
    * Retorna se o insumo pertence a algum grupo do carrinho 
    * @param {object} input O insumo
    * @param {DataCart} dataCart O carrinho  
    */
   static isGroupValid(input, dataCart) {
      return dataCart.getGroupIDS().includes(input.groupId)
   }

   /**
    * Retorna se um insumo tem relação com algum item do carrinho
    * @param {object} input O insumo
    * @param {DataCart} dataCart O carrinho   
    */
   static isInputRelationValid(input, dataCart) {
      return !!Datasheet.getRelatedComposition(input, dataCart)
   }

   /**
    * Retorna as composições que estão relacionadas com aquele insumo 
    * @param {object} input O insumo
    * @param {DataCart} dataCart O carrinho  
    */
   static getRelatedComposition(input, dataCart) {
      const allCompositions = dataCart.getConfirmedOptions()
      const relatedCompositionIdx = allCompositions.findIndex(composition => Datasheet.isRelated(input, composition))

      if (relatedCompositionIdx < 0) return null

      return { ...allCompositions[relatedCompositionIdx], index: relatedCompositionIdx }
   }

   /**
    * Retorna se um insumo está relacionado com uma composição 
    * @param {object} input O insumo
    * @param {object} composition A composição 
    */
   static isRelated(input, composition) {
      const matchesOptional = Number(input.opt) === Number(composition.componentID ?? composition.id)
      const matchesColor = Number(input.fK) === Number(composition.colorID) || (Number(input.colorId) === 0)
      const matchesExact = +input.relComm ? Number(input.id) === Number(composition.id) : true

      return matchesOptional && matchesColor && matchesExact
   }

   /**
    * Retorna se algum validador é válido
    * Caso não houver validador retorna verdadeiro
    */
   static isValidatorsValid(input, validators, dataCart) {

      const allValidators = Datasheet.getValidatorsForInput(input, validators)
      const hasSomeValidator = !!allValidators.length

      if (!hasSomeValidator) {
         return true
      }


      const validatorResults = Ruler.checkAllRuleGroups(allValidators, dataCart)
      const hasValidValidator = validatorResults.some(result => result.isValid)

      Datasheet.validatorResults.push(validatorResults)

      if (!hasValidValidator) {
         return false
      }

      return true
   }

   /**
    * Aplica um nome em um insumo 
    */
   static applyName(input, names) {
      return { ...input, name: (names[input.id]?.name ?? '[Erro no nome do insumo]') }
   }

   /**
    * Coloca as informações da composição relacionada no insumo 
    */
   static applyRelatedInfo(input, dataCart, data) {

      const coordinator = new AssemblyCoordinator(data, dataCart)
      const namesProvider = new ResourceNamesProvider(data)

      const inputToUse = structuredClone(input)
      const relatedOptional = Datasheet.getRelatedComposition(input, dataCart)

      let optional = null
      let composition = null

      if (relatedOptional.type === 'input') {

         const parentCombination = coordinator.getParentCombinationForCommodity(relatedOptional)
         const parentOptional = coordinator.getParentOptionalForCombination(parentCombination)
         const parentComposition = coordinator.getParentCompositionForOptional(parentOptional)

         optional = parentOptional
         composition = parentComposition

      } else {

         const parentComposition = coordinator.getParentCompositionForOptional(relatedOptional)

         optional = relatedOptional
         composition = parentComposition

      }

      inputToUse.groupName = namesProvider.getGroupName(composition.groupID)
      inputToUse.optID = composition.id
      inputToUse.optID2 = optional.children
      inputToUse.optionTitle = optional.title

      return inputToUse
   }

   /**
    * Aplica as fórmulas em um insumo 
    */
   static cloneInputWithFormulas(input, validators, formulas, dataCart, allVariables) {

      const validValidator = Datasheet.getValidValidator(input, validators, dataCart)
      const validFormulas = (validValidator?.group?.formula ?? []).filter(formula => Datasheet.isFormulaValid(formula, dataCart))

      if (!validFormulas.length) return [input]

      return validFormulas.map(formula => Datasheet.getInputWithFormula(input, formula, formulas, allVariables))
   }

   /**
    * Retorna um insumo com uma fórmula calculáda 
    */
   static getInputWithFormula(input, formula, formulas, allVariables) {

      //Clonando os valores
      const inputToUse = structuredClone(input)
      const formulaToUse = structuredClone(formula)

      //Pegando fórmulas
      const consumnFormula = formulas[formulaToUse.fCons]?.formula ?? ''
      const weightFormula = formulas[formulaToUse.fWeight]?.formula ?? ''
      const technicalFormula = formulas[formulaToUse.fTec]?.formula ?? ''

      inputToUse.formulas = {}
      inputToUse.formulas.consumID = Number(formulaToUse.fCons)
      inputToUse.formulas.weightID = Number(formulaToUse.fWeight)
      inputToUse.formulas.technicalID = Number(formulaToUse.fTec)
      inputToUse.formulas.consum = consumnFormula
      inputToUse.formulas.weight = weightFormula
      inputToUse.formulas.technical = technicalFormula

      //Calculando fórmulas
      const consumnCalculation = FormulaParser.calculate(consumnFormula, allVariables)
      const weightCalculation = FormulaParser.calculate(weightFormula, allVariables)
      const technicalCalculation = FormulaParser.calculate(technicalFormula, allVariables)

      //Adicionando valores
      if (consumnCalculation.result) inputToUse.consum = consumnCalculation.result
      if (weightCalculation.result) inputToUse.wFormula = weightCalculation.result
      if (technicalCalculation.result) inputToUse.tFormula = technicalCalculation.result

      inputToUse.calculations = {
         consumn: consumnCalculation,
         weight: weightCalculation,
         technical: technicalCalculation,
      }

      //Adicionando mensagens de erro
      inputToUse.cMessage = consumnCalculation.code > 1 && {
         title: 'Fórmula de Consumo',
         message: consumnCalculation.message,
         variables: consumnCalculation.variables,
         formula: consumnFormula,
         formulaID: inputToUse.formulas.consumID
      }

      inputToUse.wMessage = weightCalculation.code > 1 && {
         title: 'Fórmula de Peso',
         message: weightCalculation.message,
         formula: weightFormula,
         variables: weightCalculation.variables,
         formulaID: inputToUse.formulas.weightID
      }

      // console.log(technicalCalculation);
      

      inputToUse.tMessage = technicalCalculation.code > 1 && {
         title: 'Fórmula de Técnica',
         message: technicalCalculation.message,
         formula: technicalFormula,
         variables: technicalCalculation.variables,
         formulaID: inputToUse.formulas.technicalID
      }

      return inputToUse
   }

   /**
    * Retorna o primeiro validador que é válido de um insumo, ou undefined 
    */
   static getValidValidator(input, validators, dataCart) {
      const allValidators = Datasheet.getValidatorsForInput(input, validators)
      const validatorResults = Ruler.checkAllRuleGroups(allValidators, dataCart)

      return validatorResults.find(result => result.isValid)
   }

   /**
    * Retorna se uma fórmula pode ser calculada  
    */
   static isFormulaValid(formula, dataCart) {
      return Number(formula.nPiece ?? 0) <= dataCart.getMeasuresAmount()
   }

   /**
    * Retorna os validadores deste insumo 
    */
   static getValidatorsForInput(input, validators) {
      return Utils.parseNumbersString(input.validator)
         .map(id => validators[id])
         .filter(Boolean)
         .map(validator => (Datasheet.treatInputValidator(validator)))
   }

   /**
    * Trata as chaves dos JSONs dos validadores 
    */
   static treatInputValidator(validator) {
      return {

         id: validator.id,
         blocked: false,
         formula: validator.formula,
         title: validator.title,
         action: 2,
         rules: (validator.rule ?? []).map(rule => ({

            id: Number(rule.id),
            classifications: rule.class,
            compositions: rule.comp,
            lines: rule.line,
            optionals: rule.opt,
            prints: rule.print,
            variables: rule.variable,
            ruleClass: Number(rule.rClass),
            ruleComposition: Number(rule.rComp),
            ruleLine: Number(rule.rLine),
            ruleOptional: Number(rule.rOpt),
            rulePrint: Number(rule.rPrint),
            ruleVariable: Number(rule.rVariable),
            minHeight: 0,
            maxHeight: 0,
            maxWidth: 0,
            minWidth: 0,
            maxArea: 0,
            minArea: 0

         }))
      }
   }

   /**
    * Busca os jsons necessários para a Ficha Técnica na nubem 
    */
   static async fetchAndCacheData(productID) {
      try {

         if (Datasheet.cachedData.get(productID)) return Datasheet.cachedData.get(productID)

         let [names, validators, inputs, formulas] = await Promise.all([

            Datasheet.fetchJSON(`${STORAGE_URL}portal/product/commodity-name-${productID}.json?t=${new Date().getTime()}`),
            Datasheet.fetchJSON(`${STORAGE_URL}portal/product/validator-${productID}.json?t=${new Date().getTime()}`),
            Datasheet.fetchJSON(`${STORAGE_URL}portal/product/commodity-${productID}.json?t=${new Date().getTime()}`),
            Datasheet.fetchJSON(`${STORAGE_URL}portal/product/formula-${productID}.json?t=${new Date().getTime()}`)

         ])

         names = Utils.toHash(names)
         validators = Utils.toHash(validators)
         formulas = Utils.toHash(formulas)
         inputs = inputs.commodity

         Datasheet.cachedData.set(productID, [names, validators, inputs, formulas])

         return [names, validators, inputs, formulas]

      } catch (error) {

         console.warn('(Ficha Técnica) Houve um erro ao parsear os insumos.')
         return [null, null, null, null]

      }
   }

   /**
    * Limpa o cache da classe
    */
   static clearCache() {
      Datasheet.cachedData = new Map()
   }

   /**
    * Busca uma URL, retorna null caso houver algum erro
    */
   static async fetchJSON(url) {
      try {

         return await APIManager.fetchJSON(url + '?t=' + crypto.randomUUID())

      } catch (error) {

         return null

      }
   }
}