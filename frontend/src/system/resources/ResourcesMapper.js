/**
 * Classe responsável mapear os dados da montagem para nomes inteligíveis
 * @author Fernando Petri
 */
export class ResourcesMapper {

   /**
    * As chaves iniciais do arquivo do produto
    */
   static ORIGIN_KEYS = Object.freeze({
      PRODUCT: 'product',
      PREDEFINED_MEASURES: 'predefinedMeas',
      MODELS: 'model',
      CLASSIFICATIONS: 'modelClassification',
      LINES: 'modelLine',
      GROUPS: 'group',
      COMPOSITIONS: 'groupComposition',
      OPTIONALS: 'compositionOptional',
      COMBINATIONS: 'optionalCombination',
      COMMODITIES: 'combinationCommodity',
      FORMS: 'form',
      COMPOSITION_RULES: 'ruleGroupComponent',
      OPTIONAL_RULES: 'ruleGroupOptional',
      ENVIRONMENTS: 'environment',
      WARRANTIES: 'warranty'
   })

   /**
    * As chaves de destino do produto mapeado
    */
   static FINAL_KEYS = Object.freeze({
      PRODUCT: 'product',
      PREDEFINED_MEASURES: 'measures',
      MODELS: 'models',
      CLASSIFICATIONS: 'classifications',
      LINES: 'lines',
      GROUPS: 'groups',
      COMPOSITIONS: 'compositions',
      OPTIONALS: 'optionals',
      COMBINATIONS: 'combinations',
      COMMODITIES: 'commodities',
      FORMS: 'forms',
      COMPOSITION_RULES: 'compositionRules',
      OPTIONAL_RULES: 'optionalRules',
      ENVIRONMENTS: 'environments',
      WARRANTIES: 'warranties'
   })

   /**
    * Mapeia os dados de montagem
    */
   static map({
      resources = {},
      names = {}
   }) {

      const ORIGIN_KEYS = ResourcesMapper.ORIGIN_KEYS
      const FINAL_KEYS = ResourcesMapper.FINAL_KEYS

      const product = resources[ORIGIN_KEYS.PRODUCT]
      const measures = resources[ORIGIN_KEYS.PREDEFINED_MEASURES]
      const models = resources[ORIGIN_KEYS.MODELS]
      const classifications = resources[ORIGIN_KEYS.CLASSIFICATIONS]
      const lines = resources[ORIGIN_KEYS.LINES]
      const groups = resources[ORIGIN_KEYS.GROUPS]
      const compositions = resources[ORIGIN_KEYS.COMPOSITIONS]
      const optionals = resources[ORIGIN_KEYS.OPTIONALS]
      const combinations = resources[ORIGIN_KEYS.COMBINATIONS]
      const commodities = resources[ORIGIN_KEYS.COMMODITIES]
      const forms = resources[ORIGIN_KEYS.FORMS]
      const compositionRules = resources[ORIGIN_KEYS.COMPOSITION_RULES]
      const optionalRules = resources[ORIGIN_KEYS.OPTIONAL_RULES]
      const environments = resources[ORIGIN_KEYS.ENVIRONMENTS]
      const warranties = resources[ORIGIN_KEYS.WARRANTIES]      

      return {
         [FINAL_KEYS.PRODUCT]: this.#mapProduct(product),
         [FINAL_KEYS.PREDEFINED_MEASURES]: this.#mapPredefinedMeasures(measures),
         [FINAL_KEYS.MODELS]: this.#mapModels(models),
         [FINAL_KEYS.CLASSIFICATIONS]: this.#mapClassifications(classifications),
         [FINAL_KEYS.LINES]: this.#mapLines(lines),
         [FINAL_KEYS.GROUPS]: this.#mapGroups(groups),
         [FINAL_KEYS.COMPOSITIONS]: this.#mapCompositions(compositions),
         [FINAL_KEYS.OPTIONALS]: this.#mapOptionals(optionals, names),
         [FINAL_KEYS.COMBINATIONS]: this.#mapCombinations(combinations),
         [FINAL_KEYS.COMMODITIES]: this.#mapCommodities(commodities),
         [FINAL_KEYS.FORMS]: this.#mapForms(forms),
         [FINAL_KEYS.COMPOSITION_RULES]: this.#mapCompositionRules(compositionRules),
         [FINAL_KEYS.OPTIONAL_RULES]: this.#mapOptionalRules(optionalRules),
         [FINAL_KEYS.ENVIRONMENTS]: this.#mapEnvironments(environments),
         [FINAL_KEYS.WARRANTIES]: this.#mapWarranties(warranties),
      }
   }

   /**
    * Mapeia os dados do produto
    * @param {object[]} products Os dados do produto em um array
    * @returns {object} Os dados do produto mapeados
    */
   static #mapProduct(product = []) {
      return product.map(product => ({
         id: product.id,
         title: product.title,
         image: product.image,
         classification: product.class,
         category: product.cat,
         maxPieces: product.qtdP,
         help: {
            enabled: product.allSH,
            content: product.sHelp
         },
         availability: {
            title: product.avail,
            days: product.availD,
         },
         nomenclature: {
            piece: product.namePiece,
            width: product.nameW,
            height: product.nameH,
            area: product.nameArea,
            model: product.nameModel,
            line: product.nameLine,
            optionals: product.nameOpt,
         },
         warranty: {
            id: product.warrID,
            title: product.warr,
            days: product.warrD,
            addition: 0
         },
         layout: {
            hideInformation: product.infoHd,
            hideWidth: Boolean(+product.atvMeas1),
            hideHeight: Boolean(+product.atvMeas2),
            hideArea: Boolean(+product.atvMeasArea),
            hidePiece: Boolean(+product.atvPiece)
         }
      }))[0]
   }

   /**
    * Mapeia as medidas predefinidas
    * @param {object[]} measures Os dados das medidas em um array
    * @returns {object} Os das medidas predefinidas mapeadas
    */
   static #mapPredefinedMeasures(measures = []) {
      return measures.map(predefinedConfig => ({
         usePredefinedWidth: predefinedConfig.preMeas1,
         usePredefinedHeight: predefinedConfig.preMeas2,
         predefinedWidths: predefinedConfig.meas1,
         predefinedHeights: predefinedConfig.meas2,
      }))[0]
   }

   /**
    * Mapeia os modelos do produto
    * @param {object[]} models Os modelos
    * @returns {object[]} Os modelos mapeados
    */
   static #mapModels(models = []) {
      return models.map(model => ({
         id: model.id,
         title: model.model,
         image: model.image,
         piece: model.qtdPM,
         measures: {
            ignoreMeasures: model.ignM,
            ignorePieceMeasures: model.ignMP,
            isNonStandard: model.nonStd,
            standard: {
               maxW: model.maxW,
               minW: model.minW,
               maxH: model.maxH,
               minH: model.minH,
               minS: model.minS,
               maxS: model.maxS,
               maxWP: model.maxWP,
               minWP: model.minWP,
               maxHP: model.maxHP,
               minHP: model.minHP,
               minSP: model.minSP,
               maxSP: model.maxSP,
            },
            nonStandard: {
               nonMaxW: model.nonMaxw,
               nonMinW: model.nonMinW,
               nonMaxH: model.nonMaxH,
               nonMinH: model.nonMinH,
               nonMaxS: model.nonMinS,
               nonMinS: model.nonMaxS,
            }
         },
         predefinedMeasures: {
            checkWidth: model.preMeas1,
            checkHeight: model.preMeas2,
            predefinedWidths: model.meas1,
            predefinedHeights: model.meas2,
         },
         help: {
            enabled: model.allSH,
            content: model.sHelp
         },
         additionalDays: {
            delivery: model.addD,
            production: model.addP
         },
         productsRelated: model.relProd,
      }))
   }

   /**
    * Mapeia as classificações do produto
    * @param {object[]} classifications As classificações
    * @returns {object[]} As classificações mapeadas
    */

   static #mapClassifications(classifications = []) {
      return classifications.map(classification => ({
         id: classification.id,
         title: classification.class,
         parent: classification.parent,
         piece: classification.pieces,
         modelID: classification.model,
         line: classification.line,
         sort: classification.sort ?? Infinity,
         measures: {
            minW: classification.minW,
            maxW: classification.maxW,
            minH: classification.minH,
            maxH: classification.maxH,
            minS: classification.minS,
            maxS: classification.maxS,
         },
         additionalDays: {
            delivery: classification.addD,
            production: classification.addP,
         }
      }))
   }

   /**
    * Mapeia as linhas do produto
    * @param {object[]} lines As linhas
    * @returns {object[]} As linhas mapeadas
    */
   static #mapLines(lines = []) {
      return lines.map(line => ({
         id: line.id,
         title: line.line,
         modelLineID: line.modelLine,
         modelID: line.model,
         measures: {
            minH: line.minH,
            maxH: line.maxH,
            minW: line.minW,
            maxW: line.maxW,
            minS: line.minS,
            maxS: line.maxS,
         },
         help: {
            enabled: line.allSH,
            content: line.sHelp
         },
         additionalDays: {
            delivery: line.dayDeliv,
            production: line.dayProd,
         }
      }))
   }

   /**
    * Mapeia a lista de grupos
    * @param {object[]} groups Os grupos do produto
    * @returns {object[]} Os grupos mapeados
    */
   static #mapGroups(groups = []) {
      return groups.map(group => ({
         id: group.id,
         modelID: group.model,
         title: group.title,
         piece: group.piece,
         help: {
            enabled: group.allSH,
            content: group.sHelp
         }
      }))
   }

   /**
    * Mapeia as composições
    * @param {object[]} compositions A lista de composições
    * @returns {object[]} As composições mapeadas
    */
   static #mapCompositions(compositions = []) {
       
      return compositions.map(composition => ({
         id: composition.id,
         title: composition.opt,
         parent: composition.parent,
         groupID: composition.group,
         modelID: composition.model,
         lineID: composition.line,
         categoryID: Number(composition.cat),
         componentID: composition.comp,
         modelClassifID: composition.mlClass,
         search: {
            enabled: composition.finCat,
            type: composition.search
         },
         options: {
            isOptional: composition.optional,
            isRequired: composition.req,
         },
         hiddenComponent: composition.hidComp === 'hd',
         typeCharge: composition.typeChar,
         help: {
            enabled: composition.allSH,
            content: composition.sHelp
         },
         additionalDays: {
            delivery: composition.addD,
            production: composition.addP
         }
      }))
   }

   /**
    * Mapeia os opcionais
    * @param {object[]} optionals Os opcionais da montagem
    * @param {object} names Os nomes dos opcionais 
    * @returns {object[]} Os opcionais mapeados
    */
   static #mapOptionals(optionals = [], names) {
      
      console.log(optionals);
      // debugger
      
      return optionals.map(optional => ({
         
         title: names[optional.chil],
         id: optional.id,
         parent: optional.parent,
         image: optional.imageOpt,
         lineID: optional.line,
         children: optional.chil,
         componentID:optional.chil,
         dependentID: optional.dep,
         categoryID: optional.cat,
         modelID: optional.model,
         modelClassID: optional.mlClass,
         groupID: optional.group,
         piece: optional.piece,
         variable: optional.var,
         measures: {
            ignoreTotalMeasures: optional.ignM,
            ignorePieceMeasures: optional.ignMP,
            minH: optional.minH,
            maxH: optional.maxH,
            minW: optional.minW,
            maxW: optional.maxW,
            minS: optional.minS,
            maxS: optional.maxS,
            minHP: optional.minHP,
            maxHP: optional.maxHP,
            minWP: optional.minWP,
            maxWP: optional.maxWP,
            minSP: optional.minSP,
            maxSP: optional.maxSP,
         },
         additionalDays: {
            delivery: optional.addD,
            production: optional.addP
         },
         help: {
            enabled: optional.allSH,
            content: optional.sHelp
         },
         options: {
            hideCombinations: optional.hdCombOpt,
            hideCommodity: optional.hdComm,
            hideColors: Boolean(optional.hdColor),
            hideLevel: optional.hdLvl,
         },
         formulas: optional.formula,
         proportionRules: optional.ruleProp,
         sort: optional.sortOpt,
         associatedColor: optional.assColor,
         autoSelection: optional.autoSel,
         hideDependants: optional.hdDep,
         removeRelated: optional.remRel,
         defaultSelection: optional.defSel,
         showImage: optional.shImage,
         relatedProducts: optional.relPrd
      }))
   }

   /**
    * Mapeia as combinações
    * @param {object} combinations As combinações do produto
    * @returns {object[]} As combinações mapeadas
    */
   static #mapCombinations(combinations = []) {
      return combinations.map(combination => ({
         id: combination.id,
         title: combination.opt,
         image: combination.imageCom,
         parent: combination.parent,
         primaryColor: combination.color,
         secondaryColors: combination.corSec,
         isAllColors: combination.allCor,
         isDefaultSelected: combination.dfSelComb,
         showImage: combination.shImage,
      }))
   }

   /**
    * Mapeia a lista de insumos
    * @returns {object[]} Os insumos mapeados
    */
   static #mapCommodities(commodities = []) {

      console.log('commo');
      console.log(commodities);
      // debugger
      
      return commodities.map(commodity => ({
         id: commodity.id,
         parent: commodity.parent,
         categoryID: commodity.cat,
         componentID: commodity.comp,
         selectedColorID: commodity.color,
         colorID: commodity.colorComb,
         image: commodity.imageComm,
         measures: {
            ignoreTotalMeasures: commodity.ignM,
            minW: commodity.minW,
            maxW: commodity.maxW,
            minH: commodity.minH,
            maxH: commodity.maxH,
            minS: commodity.minS,
            maxS: commodity.maxS,
         },
         lines: commodity.line,
         dependentID: commodity.dep,
         code: commodity.opt,
         title: commodity.title,
         consumption: commodity.consu,
         unit: commodity.meas,
         print: commodity.print,
         rule: commodity.rule,
         optional: commodity.optional,
         showCode: commodity.showID,
         isDefaultSelected: commodity.defSel,
         showImage: commodity.shImage,
      }))
   }

   /**
    * Mapeia os formulários
    * @param {object[]} forms Os formulários
    * @returns {object[]} Os formulários mapeados
    */
   static #mapForms(forms = []) {
      return forms.map(form => ({
         id: form.id,
         name: form.name,
         type: form.tField,
         operation: form.Opr,
         parent: form.parent,
         groupID: form.group,
         formulas: {
            standard: form.Form,
            default: form.Default,
            startFormula: form.formIn,
            endFormula: form.formTo,
         },
         optional: form.opt,
         commodity: form.comm,
         variable: form.var,
         required: form.req,
         regexjs: form.regjs,
         errorMessage: form.eMessage,
         predefined: form.pre,
         maxQuantity: form.qtdMax,
         help: {
            enabled: form.allSH,
            content: form.sHelp
         },
      }))
   }

   /**
    * Mapeia as regras de composições
    * @param {object[]} compositionRules As regras de composição
    * @returns {object[]} As regras mapeadas
    */
   static #mapCompositionRules(compositionRules = []) {
      
      return compositionRules.map(ruleGroup => ({
         id: ruleGroup.id,
         categoryID: ruleGroup.cat,
         title: ruleGroup.title,
         action: ruleGroup.action,
         message: ruleGroup.message,
         rules: (ruleGroup.rComp ?? []).map(rule => ({
            id: rule.id,
            action: Number(rule.action),
            blocked: Boolean(Number(rule.blocked)),
            description: rule.desc,
            outProportion: rule.outProp,

            classifications: rule.class,
            compositions: rule.comp,
            lines: rule.line,
            optionals: rule.opt,
            prints: rule.print,
            variables: rule.var,

            ruleClass: Number(rule.rClass),
            ruleComposition: Number(rule.rComp),
            ruleLine: Number(rule.rLine),
            ruleOptional: Number(rule.rOpt),
            rulePrint: Number(rule.rPrint),
            ruleVariable: Number(rule.rVariable),

            maxHeight: rule.maxH,
            maxWidth: rule.maxW,
            maxArea: rule.maxS,
            minHeight: rule.minH,
            minWidth: rule.minW,
            minArea: rule.minS
         }))
      }))
   }

   /**
    * Mapeia as regras de opcionais
    * @param {object[]} optionalRules As regras de opcionais
    * @returns {object[]} As regras mapeadas
    */
   static #mapOptionalRules(optionalRules = []) {
      return optionalRules.map(ruleGroup => ({
         id: ruleGroup.id,
         optionID: ruleGroup.opt,
         action: ruleGroup.action,
         title: ruleGroup.title,
         message: ruleGroup.message,
         rules: (ruleGroup.rOpt ?? []).map(rule => ({
            id: rule.id,
            action: Number(rule.action),
            blocked: Boolean(Number(rule.blocked)),
            description: rule.desc,
            outProportion: rule.outPro,

            classifications: rule.class,
            compositions: rule.compID,
            lines: rule.line,
            optionals: rule.optID,
            prints: rule.print,
            variables: rule.var,

            ruleClass: Number(rule.rClass),
            ruleComposition: Number(rule.rComp),
            ruleLine: Number(rule.rLine),
            ruleOptional: Number(rule.rOpt),
            rulePrint: Number(rule.rPrint),
            ruleVariable: Number(rule.rVariable),

            maxHeight: rule.maxH,
            maxWidth: rule.maxW,
            maxArea: rule.maxSq,
            minHeight: rule.minH,
            minWidth: rule.minW,
            minArea: rule.minSq
         }))
      }))
   }

   /**
    * Mapeia os ambientes
    * @param {object[]} environments Os ambientes
    * @returns {object[]} Os ambientes mapeados
    */
   static #mapEnvironments(environments = []) {
      return environments.map(enviroment => ({
         id: enviroment.id,
         title: enviroment.title,
         image: enviroment.image
      }))
   }

   /**
    * Mapeia as garantias
    * @param {object[]} warranties As garantias
    * @returns {object[]} As garantias mapeados
    */
   static #mapWarranties(warranties = []) {
      return warranties.map(warranty => ({
         id: warranty.id,
         addition: warranty.add,
         title: warranty.wt,
         days: warranty.days
      }))
   }
}