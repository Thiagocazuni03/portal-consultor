import Utils from '../core/Utils.js'
import DataCart from './DataCart.js'

export default class Ruler {

   /**
    * Os tipos possíveis de regras
    */
   static TYPES = Object.freeze({
      CONTAIN_ONE: 1,
      DONT_CONTAIN_ONE: 2,
      CONTAIN_ALL: 3,
      DONT_CONTAIN_ALL: 4,
   })

   /**
    * Os tipos de ações das regras
    */
   static ACTIONS = Object.freeze({
      HIDE: 1,
      SHOW: 2
   })

   /**
    * Tipos de origem que uma regra pode surgir
    */
   static SOURCES = Object.freeze({
      COMPOSITION: 1,
      OPTIONAL: 2,
      COMMODITY: 3
   })

   /**
    * Checa todas os grupos de regra de um item
    * @param {object[]} ruleGroups A lista de grupos
    * @param {DataCart} dataCart O produto montado
    * @returns {object[]} Os grupos de regras validados 
    */
   static checkAllRuleGroups(ruleGroups, dataCart) {
      if (!ruleGroups) {
         throw new Error('É preciso enviar os grupos de regras para verificar as regras.')
      }
      if (!dataCart) {
         throw new Error('É preciso enviar um carrinho para realizar a verificação de regras.')
      }

      const ruleResults = ruleGroups.map(ruleGroup => {
         return Ruler.checkRuleGroup(ruleGroup, dataCart)
      })

      // console.log("@@@@@@@@@@@@@@@@@@@@@@@");
      // console.log(ruleResults);
      // console.log("@@@@@@@@@@@@@@@@@@@@@@@");


      return ruleResults
   }

   /**
    * Checa um grupo de regra rápidamente 
    */
   static isSomeRuleGroupValid(item, dataCart) {

      const ruleGroups = Ruler.getRuleGroups(item)
      const groupsResult = ruleGroups.some(ruleGroup => Ruler.isRuleGroupValid(item, ruleGroup, dataCart))

      return groupsResult

   }

   /**
    * Checa o grupo de regra de um item 
    * @param {object} ruleGroup O grupo de regra
    * @param {DataCart} dataCart O produto montado
    */
   static checkRuleGroup(ruleGroup, dataCart) {

      const rulesToCheck = Ruler.getRulesToCheck(ruleGroup)
      const rulesResult = rulesToCheck.map(rule => Ruler.checkRule(rule, dataCart))

      console.log("¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨ruleGroup¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨¨");

      console.log({
         group: ruleGroup,
         id: ruleGroup.id,
         title: ruleGroup.title,
         action: ruleGroup.action,
         message: ruleGroup.message,
         rules: rulesResult,
         isValid: rulesResult.every(result => result.isRuleValid),
      });


      return {
         group: ruleGroup,
         id: ruleGroup.id,
         title: ruleGroup.title,
         action: ruleGroup.action,
         message: ruleGroup.message,
         rules: rulesResult,
         isValid: rulesResult.every(result => result.isRuleValid),
      }
   }

   /**
    * Checa um grupo de regra rapidamente 
    */
   static isRuleGroupValid(item, ruleGroup, dataCart) {

      const rulesToCheck = Ruler.getRulesToCheck(ruleGroup)
      const isAllRulesValid = rulesToCheck.every(rule => Ruler.checkRuleFast(rule, item, dataCart))

      return isAllRulesValid
   }

   /**
    * Checa uma regra completamente e retorna os dados
    * @param {object} rule A regra em questão
    * @param {DataCart} dataCart O produto montado
    * @returns {object} Os dados da regra checada ou não
    */
   static checkRule(rule, dataCart) {

      const { hasLineRule, isLineRuleValid } = Ruler.isLineRuleValid(rule, dataCart)
      const { hasPrintRule, isPrintRuleValid } = Ruler.isPrintRuleValid(rule, dataCart)
      const { hasCompositionRule, isCompositionRuleValid } = Ruler.isCompositionRuleValid(rule, dataCart)
      const { hasOptionalRule, isOptionalRuleValid } = Ruler.isOptionalRuleValid(rule, dataCart)
      const { hasClassificationRule, isClassificationRuleValid } = Ruler.isClassificationRuleValid(rule, dataCart)
      const { hasVariableRule, isVariableRuleValid } = Ruler.isVariableRuleValid(rule, dataCart)
      const { hasMeasureRule, isMeasureRuleValid } = Ruler.isMeasureRuleValid(rule, dataCart)

      //Verificações
      const isRuleEmpty = [hasLineRule, hasPrintRule, hasCompositionRule, hasOptionalRule, hasClassificationRule, hasVariableRule, hasMeasureRule].every(value => value === false)
      const isRuleValid = [isLineRuleValid, isPrintRuleValid, isCompositionRuleValid, isOptionalRuleValid, isClassificationRuleValid, isVariableRuleValid, isMeasureRuleValid].every(value => value === true)

      return {
         //Dados

         id: Number(rule.id),
         rule: rule,

         //Se é valido

         isRuleEmpty,
         isRuleValid,
         isLineRuleValid,
         isPrintRuleValid,
         isCompositionRuleValid,
         isOptionalRuleValid,
         isClassificationRuleValid,
         isVariableRuleValid,
         isMeasureRuleValid,

         //Se possui regra

         hasLineRule,
         hasPrintRule,
         hasCompositionRule,
         hasOptionalRule,
         hasClassificationRule,
         hasVariableRule,
         hasMeasureRule
      }
   }

   /**
    * Retorna apenas um booleano se a regra não passou, não verifica o resto da regra e traz dados extreas 
    */
   static checkRuleFast(rule, item, dataCart) {

      if (!Ruler.isLineRuleValid(rule, dataCart).isLineRuleValid) return false
      if (!Ruler.isPrintRuleValid(rule, dataCart).isPrintRuleValid) return false
      if (!Ruler.isCompositionRuleValid(rule, dataCart).isCompositionRuleValid) return false
      if (!Ruler.isOptionalRuleValid(rule, dataCart).isOptionalRuleValid) return false
      if (!Ruler.isClassificationRuleValid(rule, dataCart).isClassificationRuleValid) return false
      if (!Ruler.isVariableRuleValid(rule, dataCart).isVariableRuleValid) return false
      if (!Ruler.isMeasureRuleValid(rule, dataCart).isMeasureRuleValid) return false

      return true
   }

   /**
    * Verifica a regra de linha 
    * @param {object} rule A regra em questão
    * @param {DataCart} dataCart O produto montado
    * @returns {object} Os dados da verificação
    */
   static isLineRuleValid(rule, dataCart) {

      const ruleLines = Utils.parseNumbersString(rule.lines)
      const ruleIsEmpty = !ruleLines.length

      //Caso não possuir regra de linha
      if (ruleIsEmpty) return {
         hasLineRule: false,
         isLineRuleValid: true
      }

      //Verificando a regra
      const cartLines = [Number(dataCart.getModelLineID())]
      const isContainRuleValid = Ruler.isContainRuleValid(cartLines, ruleLines, rule.ruleLine)

      return {
         hasLineRule: true,
         isLineRuleValid: isContainRuleValid
      }
   }

   /**
    * Verifica a regra de estampa 
    * @param {object} rule A regra em questão
    * @param {DataCart} dataCart O produto montado
    * @returns {object} Os dados da verificação
    */
   static isPrintRuleValid(rule, dataCart) {

      const rulePrints = Utils.parseNumbersString(rule.prints)
      const ruleIsEmpty = !rulePrints.length

      //Caso não possuir regra de estampa
      if (ruleIsEmpty) return {
         hasPrintRule: false,
         isPrintRuleValid: true
      }

      //Verificando a regra
      const cartPrints = dataCart.getConfirmedOptions().map(option => Number(option.print))
      const isContainRuleValid = Ruler.isContainRuleValid(cartPrints, rulePrints, rule.rulePrint)

      return {
         hasPrintRule: true,
         isPrintRuleValid: isContainRuleValid
      }
   }

   /**
    * Verifica a regra de composições
    * @param {object} rule A regra em questão
    * @param {DataCart} dataCart O produto montado
    * @returns {object} Os dados da verificação
    */
   static isCompositionRuleValid(rule, dataCart) {

      const ruleCompositions = Utils.parseNumbersString(rule.compositions)
      const ruleIsEmpty = !ruleCompositions.length

      //Caso não possuir regra de linha
      if (ruleIsEmpty) return {
         hasCompositionRule: false,
         isCompositionRuleValid: true
      }

      //Verificando a regra
      const cartCompositions = dataCart.getConfirmedOptions().map(option => Number(option.categoryID))
      const isContainRuleValid = Ruler.isContainRuleValid(cartCompositions, ruleCompositions, rule.ruleComposition)

      return {
         hasCompositionRule: true,
         isCompositionRuleValid: isContainRuleValid
      }
   }

   /**
    * Verifica a regra de opcionais
    * @param {object} rule A regra em questão
    * @param {DataCart} dataCart O produto montado
    * @returns {object} Os dados da verificação
    */
   static isOptionalRuleValid(rule, dataCart) {

      const ruleOptionals = Utils.parseNumbersString(rule.optionals)
      const ruleIsEmpty = !ruleOptionals.length

      //Caso não possuir regra de linha
      if (ruleIsEmpty) return {
         hasOptionalRule: false,
         isOptionalRuleValid: true
      }

      //Verificando a regra
      const cartCompositions = dataCart.getConfirmedOptions().map(option => option.componentID)

      // console.log("##############################");
      // console.log(dataCart.getConfirmedOptions());

      // console.log(cartCompositions);
      // console.log(ruleOptionals);
      // console.log(rule.ruleOptional);
      // console.log("##############################");

      const isContainRuleValid = Ruler.isContainRuleValid(cartCompositions, ruleOptionals, rule.ruleOptional)

      return {
         hasOptionalRule: true,
         isOptionalRuleValid: isContainRuleValid
      }
   }

   /**
    * Verifica a regra de classificações
    * @param {object} rule A regra em questão
    * @param {DataCart} dataCart O produto montado
    * @returns {object} Os dados da verificação
    */
   static isClassificationRuleValid(rule, dataCart) {

      const ruleClassifications = Utils.parseNumbersString(rule.classifications)
      const ruleIsEmpty = !ruleClassifications.length

      //Caso não possuir regra de linha
      if (ruleIsEmpty) return {
         hasClassificationRule: false,
         isClassificationRuleValid: true
      }

      //Verificando a regra
      const cartClassifications = [dataCart.getClassification()?.id].filter(Boolean)
      const isContainRuleValid = Ruler.isContainRuleValid(cartClassifications, ruleClassifications, rule.ruleClass)

      return {
         hasClassificationRule: true,
         isClassificationRuleValid: isContainRuleValid
      }
   }

   /**
    * Verifica a regra de váriaveis
    * @param {object} rule A regra em questão
    * @param {DataCart} dataCart O produto montado
    * @returns {object} Os dados da verificação
    */
   static isVariableRuleValid(rule, dataCart) {

      const ruleVariables = rule.variables
      const ruleIsEmpty = !ruleVariables?.length

      //Caso não possuir regra de linha
      if (ruleIsEmpty) return {
         hasVariableRule: false,
         isVariableRuleValid: true
      }

      //Caso o tipo do valor não seja um array (Está desatualizado)
      if (!Array.isArray(ruleVariables)) return {
         hasVariableRule: true,
         isVariableRuleValid: false
      }

      const validChecks = []
      const variableSentence = ruleVariables.map(({ variable1, operator, variable2 }) => variable1 + operator + variable2)
      const allVariables = dataCart.getVariables()

      variableSentence.forEach(variable => {

         const operators = ['!=', '<=', '>=', '===', '>', '<']
         const operatorUsed = operators.find(splitter => variable.includes(splitter))

         let value1 = variable.split(operatorUsed)[0]
         let value2 = variable.split(operatorUsed)[1]

         //Caso for uma váriavel o valor1
         if (/[a-z]/i.test(value1)) {
            if (!allVariables.hasOwnProperty(value1)) return

            value1 = allVariables[value1]
         }

         //Caso for uma váriavel o valor1
         if (/[a-z]/i.test(value2)) {
            if (!allVariables.hasOwnProperty(value2)) return

            value2 = allVariables[value2]
         }

         const isComparisonValid = eval(`${value1} ${operatorUsed} ${value2}`)

         if (isComparisonValid) validChecks.push(variable)
      })

      return {
         hasVariableRule: !ruleIsEmpty,
         isVariableRuleValid: Ruler.isContainRuleValid(validChecks, variableSentence, rule.ruleVariable)
      }
   }

   /**
    * Checa as regras de medida
    * @param {object} rule A regra em questão
    * @param {DataCart} dataCart O produto montado
    * @returns {object} Os dados da verificação
    */
   static isMeasureRuleValid(rule, dataCart) {
      const ruleIsEmpty = [Number(rule.maxWidth), Number(rule.maxHeight), Number(rule.maxArea)].every(val => val === 0)

      //Verificando medidas
      const isWidthValid = Utils.isInRange(Number(rule.minWidth), dataCart.getTotalWidth(), Number(rule.maxWidth)) || !Number(rule.maxWidth)
      const isHeightValid = Utils.isInRange(Number(rule.minHeight), dataCart.getTotalHeight(), Number(rule.maxHeight)) || !Number(rule.maxHeight)
      const isAreaValid = Utils.isInRange(Number(rule.minArea), dataCart.getTotalHeight(), Number(rule.maxArea)) || !Number(rule.maxArea)

      return {
         hasMeasureRule: !ruleIsEmpty,
         isMeasureRuleValid: isWidthValid && isHeightValid && isAreaValid
      }
   }

   /**
    * Verifica a regra de conter
    * @param {number[]} cartIds A lista de ids presentes na montagem do produto
    * @param {number[]} ruleIds A lista de IDS presentes na regra
    * @param {number} containRule O ID do tipo de regra que deve ser verificada   
    */
   static isContainRuleValid(cartIds, ruleIds, containRule) {

      return {

         [Ruler.TYPES.CONTAIN_ONE]: () => ruleIds.some(ruleID => cartIds.includes(ruleID)),
         [Ruler.TYPES.DONT_CONTAIN_ONE]: () => ruleIds.some(ruleID => !cartIds.includes(ruleID)),
         [Ruler.TYPES.CONTAIN_ALL]: () => ruleIds.every(ruleID => cartIds.includes(ruleID)),
         [Ruler.TYPES.DONT_CONTAIN_ALL]: () => ruleIds.every(ruleID => !cartIds.includes(ruleID)),

      }[containRule]()
   }

   /**
    * Retorna apenas as regras que devem ser checadas
    * @param {object} ruleGroup O grupo de regras
    * @returns {object[]} A lista de regras para checar
    */
   static getRulesToCheck(ruleGroup) {
      return (ruleGroup.rules ?? []).filter(rule => !Ruler.isRuleBlocked(rule))
   }

   /**
    * Retorna se uma regra está bloqueada
    * @param {object} rule A regra em questão
    * @returns {boolean} Se está bloqueada ou não 
    */
   static isRuleBlocked(rule) {
      return Boolean(Number(rule.blocked))
   }
}