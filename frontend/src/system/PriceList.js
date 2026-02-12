import APIManager from '../api/APIManager.js'
import { STORAGE_URL } from '../api/Variables.js'
import FolderManager from '../core/FolderManager.js'
import UserStorage from '../core/UserStorage.js'
import Utils from '../core/Utils.js'
import { AssemblyCoordinator } from './AssemblyCoordinator.js'
import DataCart from './DataCart.js'
import Datasheet from './Datasheet.js'
import FormulaParser from './FormulaParser.js'
import PromotionFinder from './Promotion.js'
import { ResourcesMapper } from './resources/ResourcesMapper.js'
import { ResourceNamesProvider } from './resources/ResourcesNamesProvider.js'

/** 
 * Faz o calculo da tabela de preço
 * @author Fernando Petri
 */
export default class PriceList {

   static cachedTarrifs = new Map()
   static cachedFormulas = new Map()
   static cachedPromotions = new Map()
   static cachedDiscount = new Map()
   static cachedMarkup = new Map()

   static HEIGHT_BILLING = 1
   static WIDTH_BILLING = 2
   static UNIT_BILLING = 3
   static AREA_BILLING = 4

   static ADD_PROMOTION = 1
   static REPLACE_PROMOTION = 2

   static PERCENT_BILLING = 1
   static CASH_BILLING = 2

   static TYPE_COLLECTION = 1
   static TYPE_MODEL = 2
   static TYPE_INPUT = 3
   static TYPE_COMPONENT = 4
   static TYPE_OPTIONAL = 5

   /**
    * Processa a tabela de preço de um produto
    * @param {DataCart} dataCart A montagem do produto
    * @param {object} data Os recursos da montagem
    * @returns {Promise<object>} O resultado
    */
   static async process(dataCart, data) {

      //Dados
      const [memberID, sellerID, groupID, datasheet] = await Promise.all([
         UserStorage.getMemberInfo('id'),
         UserStorage.getSellerInfo('id'),
         UserStorage.getMemberInfo('group').then(group => group.id),
         Datasheet.process(dataCart, data)
      ])

      //Baixando
      const [tariff, formulas, discount, markup, promotion] = await Promise.all([
         PriceList.fetchTariff(dataCart.getProductID()),
         PriceList.fetchFormulas(dataCart.getProductID()),
         PriceList.fetchDiscount(dataCart.getProductID()),
         PriceList.fetchUserMarkup(dataCart.getProductID()),
         PriceList.fetchPromotion({
            sellerID,
            memberID,
            groupID,
            productID: dataCart.getProductID()
         }),
      ])

      //Objeto quando não tem tabela de preço
      const missingPriceListReturn = {
         preTotal: 0,
         total: 0,
         freight: {
            percent: 0,
            value: 0
         },
         tax: {
            percent: 0,
            value: 0
         },
         categories: []
      }

      //Retorna
      if (!tariff) return {
         missingPriceListReturn
      }

      if (!formulas) return {
         missingPriceListReturn
      }

      //Cacheando
      PriceList.cachedTarrifs.set(dataCart.getProductID(), tariff)
      PriceList.cachedFormulas.set(dataCart.getProductID(), formulas)
      PriceList.cachedPromotions.set(dataCart.getProductID(), promotion)
      PriceList.cachedDiscount.set(dataCart.getProductID(), discount)
      PriceList.cachedMarkup.set(dataCart.getProductID(), markup)
      
      //Dados
      const pricedCollections = PriceList.processCollections({
         collections: tariff.collection,
         dataCart,
         discount,
         promotion,
         markup,
         data
      })

      const pricedModels = PriceList.processModels({
         models: tariff.model,
         dataCart,
         discount,
         promotion,
         markup,
      })

      const inputsData = PriceList.processInputs({
         inputs: tariff.commodity,
         dataCart,
         datasheet,
         discount,
         promotion,
         markup,
      })

      const componentsData = PriceList.processComponents({
         components: tariff.component,
         dataCart,
         data,
         discount,
         promotion,
         markup,
      })

      const optionalsData = PriceList.processOptionals({
         optionals: tariff.optional,
         dataCart,
         data,
         discount,
         promotion,
         markup,
      })

      const finalTotal = this.getItemsTotalPrice([
         ...pricedCollections.items,
         ...pricedModels.items,
         ...inputsData.items,
         ...componentsData.items,
         ...optionalsData.items,
      ])

      const markupTotal = this.getItemsMarkupTotalPrice([
         ...pricedCollections.items,
         ...pricedModels.items,
         ...inputsData.items,
         ...componentsData.items,
         ...optionalsData.items,
      ])

      //Calculando imposto
      const taxPercent = Number(discount.product?.[dataCart.getProductID()]?.tax ?? 0)
      const taxDiscount = Number(((finalTotal / 100) * taxPercent).toFixed(2))
      const taxMarkupDiscount = Number(((markupTotal / 100) * taxPercent).toFixed(2))

      //Calculando Frete
      const freightPercent = Number(discount.product?.[dataCart.getProductID()]?.freight ?? 0)
      const freightDiscount = Number((((finalTotal - taxDiscount) / 100) * freightPercent).toFixed(2))
      // const markupTotalVal = Number(Utils.formatCurrency(markupTotal - taxMarkupDiscount - freightMarkupDiscount)) 
      const markupTotalVal = Number(Utils.formatCurrency(markupTotal))   
      const totalVal = Number(Utils.formatCurrency(finalTotal - taxDiscount - freightDiscount))
      const freightMarkupDiscount = Number((((markupTotal - taxMarkupDiscount) / 100) * freightPercent).toFixed(2))

      return {
         preTotal: finalTotal,
         // preTotal(preprice) - markupTotal 
         markup: parseFloat(markupTotalVal - totalVal).toFixed(2),  
         markupTotal: markupTotalVal,
         total: totalVal,
         freight: {
            percent: freightPercent,
            value: freightDiscount
         }, 
         tax: {
            percent: taxPercent,
            value: taxDiscount
         },
         categories: [
            pricedCollections,
            pricedModels,
            inputsData,
            componentsData,
            optionalsData
         ]
      }
   }


   /**
    * Busca a tarifa de um produto 
    */
   static async fetchTariff(productID) {
      try {

         if (PriceList.cachedTarrifs.has(productID)) return PriceList.cachedTarrifs.get(productID)

         const response = await fetch(`${STORAGE_URL}portal/tariff/${productID}.json?t=${crypto.randomUUID()}`)
         const json = await response.json()

         return json

      } catch (error) {

         console.error(error)
         console.warn('ERRO (Price List): Erro ao baixar tarifa da nuvem.')

      }
   }

   /**
    * Busca a tarifa de um produto 
    */
   static async fetchUserMarkup(productID) {
      try {

         if (PriceList.cachedMarkup.has(productID)) return PriceList.cachedMarkup.get(productID)

         const markup = await APIManager.getUserMarkup(productID)

         if (!markup) return

         markup.markupCollection = Utils.toHash(markup.markupCollection ?? [], 'markup')
         markup.markupModel = Utils.toHash(markup.markupModel ?? [], 'markup')
         markup.markupLine = Utils.toHash(markup.markupLine ?? [], 'markup')
         markup.markupComponent = Utils.toHash(markup.markupComponent ?? [], 'markup')
         markup.markupCommodity = Utils.toHash(markup.markupCommodity ?? [], 'markup')
         markup.markupOptional = Utils.toHash(markup.markupOptional ?? [], 'markup')

         return markup

      } catch (error) {

         console.error(error)
         console.warn('ERRO (Price List): Erro ao baixar tarifa da nuvem.')

      }
   }


   /**
    * Busca a promoção ideal 
    */
   static async fetchPromotion({ sellerID, memberID, groupID, productID }) {
      try {

         if (PriceList.cachedPromotions.has(productID)) return PriceList.cachedPromotions.get(productID)

         return PromotionFinder.getPromotionFor({ sellerID, memberID, groupID, productID })

      } catch (error) {

         console.error(error)
         console.warn('ERRO (Price List): Erro ao baixar promoções da nuvem.')

      }
   }

   /**
    * Busca o desconto que deve ser usado 
    */
   static async fetchDiscount(productID) {
      try {

         if (PriceList.cachedDiscount.has(productID)) return PriceList.cachedDiscount.get(productID)

         const customerProfile = UserStorage.getMemberInfo('customerProfile')
         const discountType = Number(customerProfile.typeDiscount)
         const discountID = Number(customerProfile.groupDiscount)

         let discountToUse = null

         if (discountType === 1) {

            const allDiscounts = await new FolderManager('portal', 'product').read('discount')
            const matchingDiscount = allDiscounts.find(discount => Number(discount.id) === discountID)

            if (matchingDiscount?.product) matchingDiscount.product = JSON.parse(matchingDiscount.product)
            if (matchingDiscount?.component) matchingDiscount.component = JSON.parse(matchingDiscount.component)
            if (matchingDiscount?.optional) matchingDiscount.optional = JSON.parse(matchingDiscount.optional)
            if (matchingDiscount?.commodity) matchingDiscount.commodity = JSON.parse(matchingDiscount.commodity)
            if (matchingDiscount?.model) matchingDiscount.model = JSON.parse(matchingDiscount.model)
            if (matchingDiscount?.line) matchingDiscount.line = JSON.parse(matchingDiscount.line)

            discountToUse = matchingDiscount

         } else {

            discountToUse = await UserStorage.getMemberInfo('discount')

         }

         if (discountToUse.product) discountToUse.product = Utils.toHash(discountToUse.product, 'idProduct')
         if (discountToUse.component) discountToUse.component = Utils.toHash(discountToUse.component, 'idComp')
         if (discountToUse.optional) discountToUse.optional = Utils.toHash(discountToUse.optional, 'idOpt')
         if (discountToUse.line) discountToUse.line = Utils.toHash(discountToUse.line, 'idLine')
         if (discountToUse.model) discountToUse.model = Utils.toHash(discountToUse.model, 'idModel')
         if (discountToUse.commodity) discountToUse.commodity = Utils.toHash(discountToUse.commodity, 'idComm')

         return discountToUse

      } catch (error) {

         console.error(error)
         console.warn('ERRO (Price List): Erro ao baixar descontos da nuvem.')

      }
   }

   /**
    * Busca as fórmulas na nuvem 
    */
   static async fetchFormulas(productID) {
      try {

         if (PriceList.cachedFormulas.has(productID)) return PriceList.cachedFormulas.get(productID)

         const response = await fetch(STORAGE_URL + `portal/product/formula-${productID}.json?t=${crypto.randomUUID()}`)
         const json = await response.json()

         return json

      } catch (error) {

         console.warn('ERRO (Price List): Erro ao baixar fórmulas da nuvem.')

      }
   }

   /**
    * Baixa e guarda no cache os jsons
    */
   static async fetchAndCacheData(productID) {

      //Dados
      const [memberID, sellerID, groupID] = await Promise.all([
         UserStorage.getMemberInfo('id'),
         UserStorage.getSellerInfo('id'),
         UserStorage.getMemberInfo('group').then(group => group.id),
      ])

      //Baixando
      const [tariff, formulas, discount, promotion] = await Promise.all([
         PriceList.fetchTariff(productID),
         PriceList.fetchFormulas(productID),
         PriceList.fetchDiscount(productID),
         PriceList.fetchPromotion({ sellerID, memberID, groupID, productID }),
      ])

      //Cacheando
      PriceList.cachedTarrifs.set(productID, tariff)
      PriceList.cachedFormulas.set(productID, formulas)
      PriceList.cachedPromotions.set(productID, promotion)
      PriceList.cachedDiscount.set(productID, discount)
   }

   /**
    * Processando as coleções 
    */
   static processCollections({
      collections = [],
      dataCart,
      discount,
      promotion,
      markup,
      data
   }) {

      const coordinator = new AssemblyCoordinator(data, dataCart)
      const namesProvider = new ResourceNamesProvider(data)

      const confirmedOptions = dataCart.getConfirmedOptions()
      const pricedCollections = []

      confirmedOptions.forEach(option => {

         const optional = coordinator.getOptionalForConfirmedOption(option)
         const composition = coordinator.getParentCompositionForOptional(optional)

         const matchedCollections = collections.filter(collection => {
            return Number(collection.optional) === Number(optional.children)
         })

         const validCollections = matchedCollections.filter(collection => {
            return PriceList.#isItemValid(collection, dataCart)
         })

         const matchingPrints = validCollections.filter(collection => {
            return collection.print ? Utils.parseNumbersString(collection.print).includes(+option.print) : true
         })

         const collectionsPriced = matchingPrints.flatMap(collection => {

            //Dados gerais
            const groupIndex = coordinator.getValidGroups().findIndex(group => group.id === optional.groupID)
            const isGroupGeneral = dataCart.getMeasuresAmount() > 1 && groupIndex === 0
            const typeCharge = Number(composition.typeCharge)

            //Pegando descontos que batem
            const matchingDiscounts = {
               product: [],
               line: [],
               input: []
            }

            //Pegando descontos
            const productDiscount = this.getProductDiscount(discount, dataCart.getProductID())
            const lineDiscount = this.getLineDiscount(discount, dataCart.getLineID())
            const inputDiscount = this.getInputDiscount(discount, option.id)

            if (productDiscount) matchingDiscounts.product.push({
               type: PriceList.PERCENT_BILLING,
               value: productDiscount
            })

            if (lineDiscount) matchingDiscounts.line.push({
               type: PriceList.PERCENT_BILLING,
               value: lineDiscount
            })

            if (inputDiscount) matchingDiscounts.input.push({
               type: PriceList.PERCENT_BILLING,
               value: inputDiscount
            })

            //Pegando promoções
            const matchingPromotions = (promotion?.collection ?? []).filter(promoColl => {
               return Number(promoColl.optional) === Number(optional.option.children)
            })

            const validPromotions = matchingPromotions.filter(promoColl => {
               return PriceList.#isItemValid(promoColl, dataCart)
            })

            const validPromotionPrints = validPromotions.filter(promoColl => {
               return promoColl.print ? Utils.parseNumbersString(promoColl.print).includes(+option.print) : true
            })

            const promotionToApply = validPromotionPrints[0]

            if (promotionToApply) {
               if (PriceList.isReplacePromotion(promotion)) {
                  matchingDiscounts.product = []
                  matchingDiscounts.input = []
               }

               matchingDiscounts.input.push({
                  type: Number(promotionToApply.billing),
                  value: Number(promotionToApply.price),
                  promotion: true
               })
            }

            //Pegando o tipo de desconto que vai ser usado
            const discountToUse = [
               matchingDiscounts.input,
               matchingDiscounts.line,
               matchingDiscounts.product
            ].find(discount => !!discount.length) ?? []

            //Calculando o desconto final
            const valueWithDiscount = (discountToUse ?? []).reduce((price, discount) => {
               if (discount.type === PriceList.PERCENT_BILLING) {

                  const percent = discount.value
                  const discountValue = ((price / 100) * percent)

                  discount.discounted = discountValue

                  return price - discountValue

               } else if (discount.type === PriceList.CASH_BILLING) {

                  discount.discounted = discount.value

                  return price - discount.value

               }
            }, Number(collection.price))

            
            //Item a ser cobrado, pode ter dados levemente alterados
            const itemToCharge = {
               itemCategory: 'Coleções',
               name: String(option.title),
               itemID: Number(option.id),
               compositionID: Number(composition.id),
               optionalID: Number(optional.children),
               tariffID: Number(collection.id),
               discounts: discountToUse,
               discountValue: Number(collection.price) - valueWithDiscount,
               billingID: Number(collection.billing),
               prePrice: Number(collection.price),  
               nameBilling: PriceList.getBillingName(collection.billing),
               groupName:namesProvider.getGroupName(optional.groupID),
               price: valueWithDiscount,
               unitary: Number(collection.unitary),
               typeMeasure: Number(collection.typeMeasure),
               assAmount: Number(collection.assAmount),
               minMeas: Number(collection.minMeas),
               priceFormula: option.priceFormula,
            } 
             
            
 
            //Lidando com o typeCharge
            const allItems = PriceList.#handleTypeCharge({
               itemToCharge: itemToCharge,
               typeCharge: typeCharge,
               isGroupGeneral: isGroupGeneral,
               dataCart: dataCart,
               groupIdx: groupIndex,
               groupID: optional.groupID,
               groupName: namesProvider.getGroupName(optional.groupID)
            })

            const productMarkup = this.getProductMarkup(markup)
            const modelMarkup = this.getModelMarkup(markup, dataCart.getModelID())
            const lineMarkup = this.getLineMarkup(markup, dataCart.getLineID())
            const collectionMarkup = this.getCollectionMarkup(markup, Number(optional.children))
            const markupToUse = collectionMarkup || (productMarkup + modelMarkup + lineMarkup)

            return allItems.map(item => ({
               ...item,
               markupPercent: markupToUse,
               markupAddition: (item.price / 100) * markupToUse,
               markupPrice: item.price + ((item.price / 100) * markupToUse)
            }))
         })

         pricedCollections.push(...collectionsPriced)

      })

      //Retornando os dados
      return {
         name: 'Coleções',
         type: PriceList.TYPE_COLLECTION,
         value: PriceList.getItemsTotalPrice(pricedCollections),
         items: pricedCollections,
         quantity: 1
      }
   }

   /**
    * Processando os modelos 
    */
   static processModels({
      models = [],
      dataCart,
      discount,
      promotion
   }) {

      //Pegando dados
      const cartModelID = Number(dataCart.model?.id)
      const matchingModels = models.filter(model => Number(model.modelPrimary) === cartModelID)
      const validModels = matchingModels.filter(model => this.#isItemValid(model, dataCart))

      //Processando preço
      const billedModels = validModels.map(model => {

         const modelPrice = Number(model.price)
         const measuresAmount = dataCart.getMeasuresAmount()
         const priceByMeasures = (Math.max(measuresAmount, 1) * modelPrice).toFixed(2)

         //Pegando descontos que batem
         const matchingDiscounts = {
            product: [],
            line: [],
            model: []
         }

         //Pegando descontos
         const productDiscount = this.getProductDiscount(discount, dataCart.getProductID())
         const lineDiscount = this.getLineDiscount(discount, dataCart.line?.id)
         const modelDiscount = this.getModelDiscount(discount, model.modelPrimary)

         if (productDiscount) matchingDiscounts.product.push({
            type: PriceList.PERCENT_BILLING,
            value: productDiscount
         })

         if (lineDiscount) matchingDiscounts.line.push({
            type: PriceList.PERCENT_BILLING,
            value: lineDiscount
         })

         if (modelDiscount) matchingDiscounts.model.push({
            type: PriceList.PERCENT_BILLING,
            value: modelDiscount
         })

         //Pegando promoções
         const matchingPromotionModels = (promotion?.model ?? []).filter(promoModel => Number(promoModel.model) === Number(model.modelPrimary))
         const promotionToApply = matchingPromotionModels[0]

         if (promotionToApply) {
            if (PriceList.isReplacePromotion(promotion)) {
               matchingDiscounts.product = []
               matchingDiscounts.model = []
            }

            matchingDiscounts.model.push({
               type: PriceList.PERCENT_BILLING,
               value: Number(promotionToApply.additional),
               promotion: true
            })
         }

         //Pegando o tipo de desconto que vai ser usado
         const discountToUse = [matchingDiscounts.model, matchingDiscounts.line, matchingDiscounts.product].find(discount => !!discount.length) ?? []

         //Calculando o desconto final
         const valueWithDiscount = (discountToUse ?? []).reduce((price, discount) => {
            if (discount.type === PriceList.PERCENT_BILLING) {

               discount.discounted = ((price / 100) * discount.value)

               return price - ((price / 100) * discount.value)

            } else if (discount.type === PriceList.CASH_BILLING) {

               discount.discounted = discount.value

               return price - discount.value

            }
         }, priceByMeasures)

         const itemToCharge = {
            itemCategory: 'Modelos',
            tariffID: Number(model.modelPrimary),
            quantity: Number(measuresAmount),
            unitary: Number(modelPrice),
            name: String(model.name),
            discounts: discountToUse,
            itemID: Number(model.modelPrimary),
            discountValue: priceByMeasures - valueWithDiscount,
            prePrice: Number(priceByMeasures),
            price: valueWithDiscount,
            billingID: model.billing,
            method: 'Un'
         }

         const billedModel = this.#applyBilling(itemToCharge, dataCart.getTotalMeasures())

         return billedModel
      })

      //Retornando os dados
      return {
         name: 'Modelos',
         type: PriceList.TYPE_MODEL,
         value: PriceList.getItemsTotalPrice(billedModels),
         items: billedModels,
         quantity: 1
      }
   }

   /**
    * Processando os insumos 
    */
   static processInputs({ inputs = [], dataCart, datasheet, discount, promotion, markup }) {

      const appliedInputs = []

      inputs.forEach(input => {
         const datasheetInput = datasheet.find(dataInput => Number(dataInput.id) === Number(input.commodity))
         const isItemValid = this.#isItemValid(input, dataCart)

         if (!datasheetInput) return
         if (!isItemValid) return

         //Dados
         const groupIdx = dataCart.getGroupIDS().indexOf(datasheetInput.groupId)
         const isGroupGeneral = dataCart.getMeasures() > 1 && groupIdx === 0
         const typeCharge = datasheetInput.typeCharge

         //Pegando descontos que batem
         const matchingDiscounts = {
            product: [],
            line: [],
            input: []
         }

         //Pegando descontos
         const productDiscount = this.getProductDiscount(discount, dataCart.getProductID())
         const lineDiscount = this.getLineDiscount(discount, dataCart.line?.id)
         const inputDiscount = this.getInputDiscount(discount, input.commodity)

         if (productDiscount) matchingDiscounts.product.push({
            type: PriceList.PERCENT_BILLING,
            value: productDiscount
         })

         if (lineDiscount) matchingDiscounts.line.push({
            type: PriceList.PERCENT_BILLING,
            value: lineDiscount
         })

         if (inputDiscount) matchingDiscounts.input.push({
            type: PriceList.PERCENT_BILLING,
            value: inputDiscount
         })

         //Pegando promoções
         const matchingPromotions = (promotion?.commodity ?? []).filter(promoInput => Number(promoInput.commodity) === Number(datasheetInput.id))
         const validPromotionsMatching = matchingPromotions.filter(promoInput => PriceList.#isItemValid(promoInput, dataCart))
         const promotionToApply = validPromotionsMatching[0]

         if (promotionToApply) {
            if (PriceList.isReplacePromotion(promotion)) {
               matchingDiscounts.product = []
               matchingDiscounts.input = []
            }

            matchingDiscounts.input.push({
               type: Number(promotionToApply.billing),
               value: Number(promotionToApply.price),
               promotion: true
            })
         }

         //Pegando o tipo de desconto que vai ser usado
         const discountToUse = [matchingDiscounts.input, matchingDiscounts.line, matchingDiscounts.product].find(discount => !!discount.length) ?? []

         //Calculando o desconto final
         const valueWithDiscount = (discountToUse ?? []).reduce((price, discount) => {
            if (discount.type === PriceList.PERCENT_BILLING) {

               discount.discounted = ((price / 100) * discount.value)

               return price - ((price / 100) * discount.value)

            } else if (discount.type === PriceList.CASH_BILLING) {

               discount.discounted = discount.value

               return price - discount.value

            }
         }, Number(input.price))

         //Item a ser cobrado
         const itemToCharge = {
            itemCategory: 'Insumos',
            name: String(datasheetInput.name),
            tokenParent: String(datasheetInput.tokenParent),
            itemID: Number(datasheetInput.id),
            compositionID: Number(datasheetInput.optID),
            discounts: discountToUse,
            optionalID: Number(datasheetInput.optID2),
            tariffID: Number(datasheetInput.id),
            billingID: Number(input.billing),
            prePrice: Number(input.price),
            price: valueWithDiscount,
            unitary: Number(input.price),
         }

         //Item a ser cobrado, pode ter dados levemente alterados
         const allItems = this.#handleTypeCharge({
            itemToCharge,
            isGroupGeneral,
            typeCharge,
            dataCart,
            groupIdx
         })

         const productMarkup = this.getProductMarkup(markup)
         const modelMarkup = this.getModelMarkup(markup, dataCart?.model?.id)
         const lineMarkup = this.getLineMarkup(markup, dataCart?.line?.id)
         const inputMarkup = this.getInputMarkup(markup, Number(input.commodity))
         const markupToUse = inputMarkup || (productMarkup + modelMarkup + lineMarkup)

         const itemsWithMarkup = allItems.map(item => ({
            ...item,
            markupPercent: markupToUse,
            markupAddition: (item.price / 100) * markupToUse,
            markupPrice: item.price + ((item.price / 100) * markupToUse)
         }))

         appliedInputs.push(...itemsWithMarkup)
      })

      return {
         name: 'Insumos',
         type: PriceList.TYPE_INPUT,
         value: 0,
         items: appliedInputs,
         quantity: 1
      }
   }

   /**
    * Processando os componentes 
    */
   static processComponents({ components = [], dataCart, data, discount, promotion, markup }) {

      const coordinator = new AssemblyCoordinator(data, dataCart)
      const appliedComponents = []
      const confirmedOptions = dataCart.getConfirmedOptions()

      confirmedOptions.forEach(option => {

         let compositionID = null

         if(option.type === 'input'){

            const combination = coordinator.getParentCombinationForCommodity(option)
            const optional = coordinator.getParentOptionalForCombination(combination)
            const composition = coordinator.getParentCompositionForOptional(optional)

            compositionID = composition.id

         }


         //Componentes precificados
         const matchingComponents = components.filter(component => Number(component.component) === compositionID)
         const validComponents = matchingComponents.filter(component => PriceList.#isItemValid(component, dataCart))
         const componentsPriced = validComponents.flatMap(component => {

            //Pegando verificações
            const groupIndex = dataCart.getGroupIDS().indexOf(option.groupID)
            const isGroupGeneral = dataCart.getMeasuresAmount() > 1 && groupIndex === 0
            const typeCharge = Number(option.typeCharge)

            //Pegando descontos que batem
            const matchingDiscounts = {
               product: [],
               line: [],
               component: []
            }

            //Pegando descontos
            const productDiscount = this.getProductDiscount(discount, dataCart.getProductID())
            const lineDiscount = this.getLineDiscount(discount, dataCart.line?.id)
            const componentDiscount = this.getComponentDiscount(discount, compositionID)

            if (productDiscount) matchingDiscounts.product.push({
               type: PriceList.PERCENT_BILLING,
               value: productDiscount
            })

            if (lineDiscount) matchingDiscounts.line.push({
               type: PriceList.PERCENT_BILLING,
               value: lineDiscount
            })

            if (componentDiscount) matchingDiscounts.component.push({
               type: PriceList.PERCENT_BILLING,
               value: componentDiscount
            })

            //Pegando promoções
            const matchingPromotions = (promotion?.component ?? []).filter(promoComp => Number(promoComp.component) === Number(compositionID))
            const validPromotionsMatching = matchingPromotions.filter(promoComp => PriceList.#isItemValid(promoComp, dataCart))
            const promotionToApply = validPromotionsMatching[0]

            if (promotionToApply) {
               if (PriceList.isReplacePromotion(promotion)) {
                  matchingDiscounts.product = []
                  matchingDiscounts.component = []
               }

               matchingDiscounts.component.push({
                  type: Number(promotionToApply.billing),
                  value: Number(promotionToApply.price),
                  promotion: true
               })
            }

            //Pegando o tipo de desconto que vai ser usado
            const discountToUse = [matchingDiscounts.component, matchingDiscounts.line, matchingDiscounts.product].find(discount => !!discount.length) ?? []

            //Calculando o desconto final
            const valueWithDiscount = (discountToUse ?? []).reduce((price, discount) => {
               if (discount.type === PriceList.PERCENT_BILLING) {

                  discount.discounted = ((price / 100) * discount.value)

                  return price - ((price / 100) * discount.value)

               } else if (discount.type === PriceList.CASH_BILLING) {

                  discount.discounted = discount.value

                  return price - discount.value

               }
            }, Number(component.price))

            //Item a ser cobrado, pode ter dados levemente alterados
            const itemToCharge = {
               itemCategory: 'Componentes',
               name: String(option.view.description),
               tokenParent: String(option.tokenParent),
               itemID: Number(option.id),
               compositionID: Number(option.optID),
               optionalID: Number(option.optID2),
               tariffID: Number(component.id),
               discounts: discountToUse,
               billingID: Number(component.billing),
               prePrice: Number(component.price),
               price: valueWithDiscount,
               unitary: Number(component.unitary),
               priceFormula: option.priceFormula,
            }

            //Processando o typeCharge
            const allItems = PriceList.#handleTypeCharge({
               itemToCharge: itemToCharge,
               typeCharge: typeCharge,
               isGroupGeneral: isGroupGeneral,
               dataCart: dataCart,
               groupIdx: groupIndex,
            })

            const productMarkup = this.getProductMarkup(markup)
            const modelMarkup = this.getModelMarkup(markup, dataCart?.model?.id)
            const lineMarkup = this.getLineMarkup(markup, dataCart?.line?.id)
            const componentMarkup = this.getComponentMarkup(markup, compositionID)
            const markupToUse = componentMarkup || (productMarkup + modelMarkup + lineMarkup)

            return allItems.map(item => ({
               ...item,
               markupPercent: markupToUse,
               markupAddition: (item.price / 100) * markupToUse,
               markupPrice: item.price + ((item.price / 100) * markupToUse)
            }))

         })

         appliedComponents.push(...componentsPriced)
      })


      return {
         name: 'Componentes',
         type: PriceList.TYPE_COMPONENT,
         value: PriceList.getItemsTotalPrice(appliedComponents),
         items: appliedComponents,
         quantity: 1
      }
   }

   /**
    * Processando os opcionais 
    */
   static processOptionals({
      optionals = [],
      dataCart,
      discount,
      promotion,
      markup,
      data
   }) {

      const appliedOptionals = []
      const confirmedOptions = dataCart.getConfirmedOptions()
      const namesProvider = new ResourceNamesProvider(data)

      confirmedOptions.forEach(option => {

         const optionalID = Number(option.optionChildren ?? option.children)
       
         
         const matchingOptionals = optionals.filter(optional => PriceList.#splitAndParseIDs(optional.optional).includes(optionalID))
         const validOptionals = matchingOptionals.filter(optional => PriceList.#isItemValid(optional, dataCart))
         const optionalsPriced = validOptionals.flatMap(optional => {

            //Pegando verificações
            const isGroupGeneral = dataCart.getMeasuresAmount() > 1 && dataCart.getGroupIDS().indexOf(option.groupID)
            const typeCharge = Number(option.typeCharge)

            //Pegando descontos que batem
            const matchingDiscounts = {
               product: [],
               line: [],
               optional: []
            }

            //Pegando descontos
            const productDiscount = this.getProductDiscount(discount, dataCart.getProductID())
            const lineDiscount = this.getLineDiscount(discount, dataCart.line?.id)
            const optionalDiscount = this.getOptionalDiscount(discount, optionalID)

            if (productDiscount) matchingDiscounts.product.push({
               type: PriceList.PERCENT_BILLING,
               value: productDiscount
            })

            if (lineDiscount) matchingDiscounts.line.push({
               type: PriceList.PERCENT_BILLING,
               value: lineDiscount
            })

            if (optionalDiscount) matchingDiscounts.optional.push({
               type: PriceList.PERCENT_BILLING,
               value: optionalDiscount
            })

            //Pegando promoções
            const matchingPromotions = (promotion?.optional ?? []).filter(promoOpt => Number(promoOpt.optional) === Number(optionalID))
            const validPromotionsMatching = matchingPromotions.filter(promoComp => PriceList.#isItemValid(promoComp, dataCart))
            const promotionToApply = validPromotionsMatching[0]

            if (promotionToApply) {
               if (PriceList.isReplacePromotion(promotion)) {
                  matchingDiscounts.product = []
                  matchingDiscounts.optional = []
               }

               matchingDiscounts.optional.push({
                  type: Number(promotionToApply.billing),
                  value: Number(promotionToApply.price),
                  promotion: true
               })
            }

            //Pegando o tipo de desconto que vai ser usado
            const discountToUse = [matchingDiscounts.optional, matchingDiscounts.line, matchingDiscounts.product].find(discount => !!discount.length) ?? []

            //Calculando o desconto final
            const valueWithDiscount = (discountToUse ?? []).reduce((price, discount) => {
               if (discount.type === PriceList.PERCENT_BILLING) {

                  discount.discounted = ((price / 100) * discount.value)

                  return price - ((price / 100) * discount.value)

               } else if (discount.type === PriceList.CASH_BILLING) {

                  discount.discounted = discount.value

                  return price - discount.value

               }
            }, Number(optional.price))

           

            //Item a ser cobrado, pode ter dados levemente alterados
            const itemToCharge = {
               itemCategory: 'Opcionais',
               name: `${option.view.description} > ${option.title}`,
               tokenParent: String(option.tokenParent),
               itemID: Number(option.id),
               compositionID: Number(option.parent),
               optionalID: optionalID,
               discounts: discountToUse,
               tariffID: Number(optional.id),
               billingID: Number(optional.billing),
               prePrice: Number(optional.price),
               price: valueWithDiscount,
               unitary: Number(optional.price),
               groupName:namesProvider.getGroupName(option.groupID),
               priceFormula: option.priceFormula,
               nameBilling: PriceList.getBillingName(optional.billing)
            }
            
 
            //Processando o typeCharge
            const allItems = PriceList.#handleTypeCharge({
               itemToCharge: itemToCharge,
               typeCharge: typeCharge,
               isGroupGeneral: isGroupGeneral,
               dataCart: dataCart,  
               groupID:option.groupID,
               // groupID: optional.groupID, // thiago cazuni
               groupIdx: dataCart.getGroupIDS().indexOf(option.groupID)
            })

            const productMarkup = this.getProductMarkup(markup)
            const modelMarkup = this.getModelMarkup(markup, dataCart?.model?.id)
            const lineMarkup = this.getLineMarkup(markup, dataCart?.line?.id)
            const optionalMarkup = this.getOptionalMarkup(markup, optionalID)
            const markupToUse = optionalMarkup || (productMarkup + modelMarkup + lineMarkup)

            return allItems.map(item => ({
               ...item,
               markupPercent: markupToUse,
               markupAddition: (item.price / 100) * markupToUse,
               markupPrice: item.price + ((item.price / 100) * markupToUse)
            }))
         })

         appliedOptionals.push(...optionalsPriced)
      })


      return {
         name: 'Opcionais',
         type: PriceList.TYPE_OPTIONAL,
         value: PriceList.getItemsTotalPrice(appliedOptionals),
         items: appliedOptionals,
         quantity: 1
      }
   }

   /**
    * Verifica as chaves de modelo/classificação/linha e compara com o carrinho
    * @param {object} item O item que seria cobrado
    * @param {DataCart} dataCart O produto  
    */
   static #isItemValid(item, dataCart) {

      const hasModel = item.model && item.model !== 'null'
      const hasLine = item.line && item.line !== 'null'
      const hasClassification = item.class && item.class !== 'null'

      const isModelValid = Utils.parseNumbersString(item.model).includes(dataCart.getModelID())
      const isLineValid = Utils.parseNumbersString(item.line).includes(dataCart.getLineID())
      const isClassifValid = Utils.parseNumbersString(item.class).includes(dataCart.getClassificationID())
      const isMeasureValid = dataCart.getMeasures().some(measure => PriceList.isMeasureValid(measure, item))

      return [
         hasModel ? isModelValid : true,
         hasLine ? isLineValid : true,
         hasClassification ? isClassifValid : true,
         isMeasureValid

      ].every(Boolean)
   }

   /**
    * Transforma uma string 28,39,49 em um array de números 
    */
   static #splitAndParseIDs(idString) {
      if (!idString) return []
      return String(idString).split(',').map(Number).filter(value => !Number.isNaN(value))
   }

   /**
    * Processa o typeCharge de um item 
    * Caso for type = 2, usa as medidas totais e cobra um item
    * Caso for type = 1 e for o grupo geral, cobra uma vez para cada peça
    * Caso for type = 1 e for outro grupo, cobra apenas uma vez 
    */
   static #handleTypeCharge({
      itemToCharge,
      typeCharge,
      isGroupGeneral,
      dataCart,
      groupID,
      groupIdx,
   }) {

      const hasPriceFormula = !!(itemToCharge.priceFormula ?? []).length
      const formulaJSON = PriceList.cachedFormulas.get(dataCart.getProductID())

      //Caso possuir fórmula de cobrança
      if (hasPriceFormula) {
         if (!formulaJSON) return []

         const matchingFormulas = itemToCharge.priceFormula.map(formula => formulaJSON.find(storedFormula => Number(storedFormula.id) === Number(formula.priceFormula)))
         const formulaResults = matchingFormulas.map(formula => FormulaParser.calculate(formula.formula, { ...Datasheet.lastVariables, ...DataCart.getAllVariables(dataCart) }))
         const firstValidResultIdx = formulaResults.findIndex(result => result.result !== undefined && result.code === 0)

         if (firstValidResultIdx === -1) return []

         itemToCharge.formulaResult = formulaResults[firstValidResultIdx]
         itemToCharge.priceMultiplier = Number(formulaResults[firstValidResultIdx].result)
         itemToCharge.oldPrice = itemToCharge.price
         itemToCharge.priceFormulaID = Number(matchingFormulas[firstValidResultIdx].id)
         itemToCharge.prePrice = itemToCharge.price * Number(formulaResults[firstValidResultIdx].result)
         itemToCharge.formulaPrice = itemToCharge.price * Number(formulaResults[firstValidResultIdx].result)
      }
 

      //Caso for cobrar como GERAL
      if (typeCharge === 2) {
         const generalGroupItem = structuredClone(itemToCharge)
         const itemBilled = PriceList.#applyBilling(generalGroupItem, {
            width: dataCart.getTotalWidth(),
            height: dataCart.getTotalHeight(),
            area: dataCart.getTotalArea()
         })

         itemBilled.name = `${itemToCharge.name} (Geral)`
         itemBilled.groupID = groupID

         return [itemBilled]
      }

      //Caso for grupo geral
      if (isGroupGeneral) {
         const itemsToBill = [...Array(dataCart.getMeasuresAmount())].map(() => ({ ...itemToCharge }))
         const itemsBilled = itemsToBill.map((item, index) => PriceList.#applyBilling(item, dataCart.getMeasures()[index]))

         itemsBilled.forEach((item, index) => item.name = `${item.name} (PÇ ${Utils.alphabet(true)[index]})`)
         itemsBilled.forEach((item, index) => item.groupID = Number(dataCart.getGroupIDS()[index + 1]))

         return [...itemsBilled]
      }

      //Caso for uma peça normal
      const pieceItem = structuredClone(itemToCharge)
      const billedItem = PriceList.#applyBilling(pieceItem, dataCart.getMeasures()[groupIdx])

      billedItem.name = `${billedItem.name} (PÇ ${Utils.alphabet(true)[groupIdx]})`
      billedItem.groupID = Number(groupID)

      return [billedItem]
   }

   /**
    * Precifica o item mandado com uma medida 
    */
   static #applyBilling(item, measure) {

      //Clonando e pgando informações
      const clonedItem = JSON.parse(JSON.stringify(item))
      const itemPrice = Number(clonedItem.formulaPrice ?? clonedItem.price)
      const shouldVerifyMeasure = item.typeMeasure === 4 && item.minMeas

      //Dados
      let totalPrice = 0
      let method = null
      let methodUsed = null
      let usedMinMeasure = false

      //Setando dados antes de processaro preço
      clonedItem.unitary = item.prePrice
      clonedItem.quantity = 1

      //Tipos de aplicagem
      const billingProcesses = {
         [PriceList.HEIGHT_BILLING]: () => {

            const isMeasureLower = Number(measure.height) < Number(item.minMeas ?? 0)
            const shouldReplaceMeasure = isMeasureLower && shouldVerifyMeasure
            const measureToUse = shouldReplaceMeasure ? Number(item.assAmount) : Number(measure.height)

            if (shouldReplaceMeasure) usedMinMeasure = true

            methodUsed = measureToUse
            totalPrice = measureToUse * itemPrice
            method = `Alt (${measureToUse.toFixed(2)})`

         },
         [PriceList.WIDTH_BILLING]: () => {

            const isMeasureLower = Number(measure.width) < Number(item.minMeas ?? 0)
            const shouldReplaceMeasure = isMeasureLower && shouldVerifyMeasure
            const measureToUse = shouldReplaceMeasure ? Number(item.assAmount) : Number(measure.width)

            if (shouldReplaceMeasure) usedMinMeasure = true

            methodUsed = measureToUse
            totalPrice = Number(measureToUse) * itemPrice
            method = `Larg (${measureToUse.toFixed(2)})`

         },
         [PriceList.UNIT_BILLING]: () => {

            methodUsed = 1
            totalPrice = itemPrice
            method = 'Un'

         },
         [PriceList.AREA_BILLING]: () => {

            const isMeasureLower = Number(measure.area) < Number(item.minMeas ?? 0)
            const shouldReplaceMeasure = isMeasureLower && shouldVerifyMeasure
            const measureToUse = shouldReplaceMeasure ? Number(item.assAmount) : Number(measure.area)

            if (shouldReplaceMeasure) usedMinMeasure = true

            methodUsed = measureToUse
            totalPrice = Number(measureToUse) * itemPrice
            method = `(${measureToUse}) m²`
         }
      }

      billingProcesses[clonedItem?.billingID]()

      //Adicionando valores
      clonedItem.usedMinMeasure = usedMinMeasure
      clonedItem.price = totalPrice
      clonedItem.method = method
      clonedItem.methodUsed = methodUsed
      clonedItem.pieceRelated = measure.identifier
      clonedItem.pieceID = measure.id

      return clonedItem
   }

   static isReplacePromotion(promotion) {

      return Number(promotion.info.typeAction) === PriceList.REPLACE_PROMOTION

   }

   /**
    * Retorna o total dos itens do array precificados 
    */
   static getItemsTotalPrice(objectsArray = []) {
      return objectsArray.reduce((total, item) => {
         if (!item) return

         const itemPrice = Number(item?.price)
         const isPriceNan = isNaN(itemPrice)

         if (isPriceNan) {
            return total
         }

         return total + itemPrice
      }, 0)
   }

   /**
    * Retorna o total dos itens do array considerando o markup
    */
   static getItemsMarkupTotalPrice(objectsArray = []) {
      return objectsArray.reduce((total, item) => {
         if (!item) return

         const itemPrice = Number(item?.markupPrice ?? item?.price)
         const isPriceNan = isNaN(itemPrice)

         if (isPriceNan) {
            return total
         }

         return total + itemPrice
      }, 0)
   }

   /**
    * Verifica se um item é comportado dentro de certa medida 
    */
   static isMeasureValid(measure, item) {
      const isWidthValid = Utils.isInRange(item.minWidth ?? -Infinity, measure.width, item.maxWidth ?? Infinity) || !Number(item.maxWidth)
      const isHeightValid = Utils.isInRange(item.minHeight ?? -Infinity, measure.height, item.maxHeight ?? Infinity) || !Number(item.maxHeight)
      const isAreaValid = Utils.isInRange(item.minArea ?? -Infinity, measure.area, item.maxArea ?? Infinity) || !Number(item.maxArea)

      return isWidthValid && isHeightValid && isAreaValid
   }

   static getProductDiscount(discount, productID) {
      const productDiscount = discount.product?.[productID]?.product ?? 0
      const treatedDiscount = Number(String(productDiscount).replace(/%$/, ''))

      return treatedDiscount
   }

   static getLineDiscount(discount, lineID) {
      const lineDiscount = discount.line?.[lineID]?.discount ?? 0
      const treatedDiscount = Number(String(lineDiscount).replace(/%$/, ''))

      return treatedDiscount
   }

   static getModelDiscount(discount, modelID) {
      const modelDiscount = discount.model?.[modelID]?.discount ?? 0
      const treatedDiscount = Number(String(modelDiscount).replace(/%$/, ''))

      return treatedDiscount
   }

   static getComponentDiscount(discount, componentID) {
      const componentDiscount = discount.component?.[componentID]?.discount ?? 0
      const treatedDiscount = Number(String(componentDiscount).replace(/%$/, ''))

      return treatedDiscount
   }

   static getInputDiscount(discount, inputID) {
      const inputDiscount = discount.commodity?.[inputID]?.discount ?? 0
      const treatedDiscount = Number(String(inputDiscount).replace(/%$/, ''))

      return treatedDiscount
   }

   static getOptionalDiscount(discount, optionalID) {
      const inputDiscount = discount.optional?.[optionalID]?.discount ?? 0
      const treatedDiscount = Number(String(inputDiscount).replace(/%$/, ''))

      return treatedDiscount
   }

   static getProductMarkup(markup) {
      const productMarkup = markup?.markupProduct ?? '0%'
      const treatedMarkup = Number(String(productMarkup).replace(/%$/gi, '').replace(/,/gi, '.'))

      return treatedMarkup
   }

   static getModelMarkup(markup, modelID) {
      const modelMarkup = markup?.markupModel[modelID]?.value ?? 0
      const treatedMarkup = Number(String(modelMarkup).replace(/%$/gi, '').replace(/,/gi, '.'))

      return treatedMarkup
   }

   static getLineMarkup(markup, lineID) {
      const lineMarkup = markup?.markupLine[lineID]?.value ?? 0
      const treatedMarkup = Number(String(lineMarkup).replace(/%$/gi, '').replace(/,/gi, '.'))

      return treatedMarkup
   }

   static getCollectionMarkup(markup, optionalID) {
      const collectionMarkup = markup?.markupCollection[optionalID]?.value ?? 0
      const treatedMarkup = Number(String(collectionMarkup).replace(/%$/gi, '').replace(/,/gi, '.'))

      return treatedMarkup
   }

   static getInputMarkup(markup, inputID) {
      const inputMarkup = markup?.markupCommodity[inputID]?.value ?? 0
      const treatedMarkup = Number(String(inputMarkup).replace(/%$/gi, '').replace(/,/gi, '.'))

      return treatedMarkup
   }

   static getComponentMarkup(markup, compositionID) {
      const componentMarkup = markup?.markupComponent[compositionID]?.value ?? 0
      const treatedMarkup = Number(String(componentMarkup).replace(/%$/gi, '').replace(/,/gi, '.'))

      return treatedMarkup
   }

   static getOptionalMarkup(markup, optionalID) {
      const optionalMarkup = markup?.markupOptional[optionalID]?.value ?? 0
      const treatedMarkup = Number(String(optionalMarkup).replace(/%$/gi, '').replace(/,/gi, '.'))

      return treatedMarkup
   }

   static getBillingName(billingID) {
      return ({

         [PriceList.UNIT_BILLING]: 'Unidade',
         [PriceList.HEIGHT_BILLING]: 'Altura',
         [PriceList.WIDTH_BILLING]: 'Largura',
         [PriceList.AREA_BILLING]: 'Área',

      })[billingID]
   }

   static clearCache() {
      PriceList.cachedDiscount = new Map()
      PriceList.cachedFormulas = new Map()
      PriceList.cachedPromotions = new Map()
      PriceList.cachedTarrifs = new Map()
      PriceList.cachedMarkup = new Map()
   }
}