import OrderCreatingTab from '../business/order/OrderCreatingTab.js'
import AvatarMenu from '../core/AvatarMenu.js'
import FilterTab from '../business/general/FilterTab.js'
import UserStorage from '../core/UserStorage.js'
import OrderViewTab from '../business/order/OrderViewTab.js'
import Renderer from '../core/Renderer.js'
import Initializer from '../core/Initializer.js'
import MoneyViewer from '../core/MoneyViewer.js'
import APIManager from '../api/APIManager.js'
import PopUp from '../core/PopUp.js'
import BuyerTab from '../business/buyer/BuyerTab.js'
import Sheet from '../core/Sheet.js'
import Utils from '../core/Utils.js'
import Badge from '../core/Badge.js'
import Item from '../core/Item.js'
import DotsMenu from '../core/DotsMenu.js'
import Session from '../core/Session.js'
import CartTab from '../business/general/CartTab.js'
import { ORDER_DRAFT_SEARCH_URL, APPLICATION, CURRENCY } from '../api/Variables.js'
import LoadingModal from '../business/general/LoadingModal.js'
import CartService from '../system/cart/CartService.js'
import SalesSheetOrderAdapter from '../business/order/SalesSheetOrderAdapter.js'
import OrderDeletionPrompt from '../system/prompts/OrderDeletionPrompt.js'
import OrderClosePrompt from '../system/prompts/OrderClosePrompt.js'
import $ from 'jquery'
import Translator from '../translation/Translator.js'
import PeriodPicker from '../components/datepicker.js'

class SalesController {
   constructor() {

      $('.isPageHidden').removeClass('isPageHidden')

      //Elementos
      this.pageContent = $('#CONTENT')
      this.pageTitle = $('#TITLE')
      this.newSaleBtn = $('#NEW_SALE')
      this.filterBtn = $('#FILTER')
      this.buyerBtn = $('#BUYER')
      this.headerOptions = $('#OPTIONS')
      this.footer = $('#FOOTER')
      
      

      //Estado
      this.statuses = {}
      this.params = {}
      this.queryMode = 'mix'
      this.allItems = []
      this.highestPriceFound = 0
      this.salesByQuery = 10
      this.queriedAmount = 0
      this.pastFilter = {}
      this.currentFilters = {}
      this.isFetchingDrafts = false
      this.queriedEverything = false
      this.draftsSum = 0

      //Traduzindo
      this.newSaleBtn.text(Translator.t('actions:new-sale'))
      this.pageTitle.text(Translator.t('areas:checkPoints'))

      //Classes/Elementos
      this.headerOptions.append(new AvatarMenu().getView())
      this.moneyViewer = new MoneyViewer(this.getMoneyViewerConfig())
      this.salesSheet = new Sheet(this.getSheetConfig())
      this.salesSheet.master.addClass('isFilter')
      // this.searchBar = new SearchBar(this.getSearchBarConfiguration())
      this.salesRender = new Renderer(this.getRendererConfig())
      this.currentRender = null
      this.filterTab = null

      //Eventos
      this.newSaleBtn.click(() => new OrderCreatingTab().open())
      this.buyerBtn.click(() => new BuyerTab().open())
      this.filterBtn.click(() => {
         if (!Object.keys(this.statuses).length) {
            PopUp.triggerInfo('Estamos carregando os filtros, um momento.', null, 'FILTER_TAB_LOAD')
            return
         }

         this.filterTab = new FilterTab(this.getFilterTabConfig())
      })

      //Escutador de resize da janela
      new ResizeObserver(() => this.decideRender()).observe(document.body)

      //Montando
      this.footer.prepend(this.moneyViewer.getView())

      //Inicializando
      this.decideRender()
      this.initialize()
   }

   setParam(paramName, value){
      this.params[paramName] = value
   }

   /**
    * Inicializa a página
    */
   async initialize() {
      this.statuses = Utils.toHash(await APIManager.getRepository('status'), 'id')
      console.log(this.statuses);

      // debugger
      
      await this.fetchAndAddItems()
   }

   /**
    * Baseado no tamanho da página decide o estilo de visualização que vai ser mostrado as vendas
    */
   decideRender() {
      const windowSize = window.innerWidth
      const shouldUseTable = windowSize >= 1000
      const isCurrentRender = shouldUseTable ? this.salesSheet.render === this.currentRender : this.salesRender === this.currentRender
      const hasSomeItem = this.allItems.length > 0

      if (isCurrentRender) return

      this.currentRender?.setItems([])
      this.currentRender = shouldUseTable ? this.salesSheet.render : this.salesRender
      this.pageContent.empty()

      hasSomeItem
         ? this.currentRender.setItems(this.allItems)
         : null

      shouldUseTable
         ? this.pageContent.append(this.salesSheet.getView())
         : this.pageContent.append(this.salesRender.getView())

      shouldUseTable
         ? this.salesByQuery = 15
         : this.salesByQuery = 8
   }

   /**
    * Retorna a configuração da tabela 
    */

   getSheetConfig() {
      let self = this
      return {
         whenScrollHitBottom: () => this.fetchAndAddItems(),
         css: 'isSalesSheet',
         align: 'center',
         maxHeight: '100%',
         scrollabe: true,
         clickableRows: true,
         render: {
            createFunc: (data, index, array) => this.createTableRow(data, index, array),
            onRender: (render) => {
               if (!this.salesSheet) return

               const contentHeight = this.pageContent[0].clientHeight
               const tableHeight = this.salesSheet.getView()[0].clientHeight
               const tableIsOverflowing = tableHeight >= contentHeight

               this.salesSheet.getView().css('overflow', tableIsOverflowing ? 'overlay' : 'visible')
            },
            identifierKey: 'identifier',
            hasAnimation: true,
         },
         // by: thiago cazuni
         filter: {
            searchBar: {
               active:false  
            },
            css: 'isRulesSearchBar',
            label: 'Pesquisa',
            placeholder: 'Digite algo e pressione Enter...',
            onInput: ({ target }) => {
               let param = null
               if(target.value.length >= 3){
                  param = {
                     ...self.currentFilters,
                     search:target.value
                  }
   
                  self.currentFilters = param
                  self.filterSales(param) 
               } else {
                  if(target.value == ""){
                     param = {
                        ...self.currentFilters,
                        search:"" 
                     }
 
                     self.currentFilters = param
                     self.filterSales(param)
                  } 
               }
            },
            onClear: () => {
                let param = {
                  ...self.currentFilters,
                  search:"" 
               }

               self.currentFilters = param
               self.filterSales(param)
            },
            options: [
               {
                  label: 'Programa de Pontos',
                  type: 'select',
                  options: [
                     {
                        text: 'Amopontos 2025',
                        icon: 'ic-subclasses',
                        value:'mix'
                     },
                     {
                        text: 'Amopontos 2026',
                        icon: 'ic-subclasses',
                        value:'mix'
                     },
                  ],
                  onChange:async (state) => {
                     let param = {
                        ...self.currentFilters,
                        searchScope:state.value
                     }
                     self.currentFilters = param
                     self.filterSales(param) 
                  } 
               },
               {
                  label: 'Tipo',
                  type: 'select',
                  options: [
                     {
                        text: 'Todos',
                        icon: 'ic-subclasses',
                        value:'mix'
                     },
                  ],
                  onChange:async (state) => {
                     let param = {
                        ...self.currentFilters,
                        searchScope:state.value
                     }
                     self.currentFilters = param
                     self.filterSales(param) 
                  } 
               },
                  {
                  label: 'Perfil',
                  type: 'select',
                  options: [
                     {
                        text: 'Arquiteto',
                        icon: 'ic-subclasses',
                        value:'mix'
                     },
                     {
                        text: 'Escritório',
                        icon: 'ic-subclasses',
                        value:'mix'
                     },
                  ],
                  onChange:async (state) => {
                     let param = {
                        ...self.currentFilters,
                        searchScope:state.value
                     }
                     self.currentFilters = param
                     self.filterSales(param) 
                  } 
               },
               {
                  label: 'Status',
                  type: 'select',
                  options: [
                     {
                        text: 'Todos',
                        icon: 'ic-subclasses',
                        value:'mix'
                     },  
                  ],
                  onChange:async (state) => {
                     let param = {
                        ...self.currentFilters,
                        searchScope:state.value
                     }
                     self.currentFilters = param
                     self.filterSales(param) 
                  } 
               },
               {
                  label: 'Período',
                  type:'datepicker', 
                  // value:`${PeriodPicker.formatBR('2022-01-01')} ${PeriodPicker.formatBR(this.getFormatedTodayDate())}`,
                  value:{ startDate: '2022-01-01', endDate: this.getFormatedTodayDate() },
                  onChange:(state) => {
                     let param = {
                        ...self.currentFilters,
                        date:state
                     } 

                     self.currentFilters = param
                     self.filterSales(param) 
                  }
               },
            
            ]
         }, 
         layout: [
            {
               keys: ['id'],
               label: '#',
               bold: true,
               size: '5%',
            },
            {
               keys: ['status'],
               label: Translator.t('checkPoints:issue-date'),
               size: '10%',
               transform: (value) => this.createStatusBadge(value)
            },
            {
               keys: ['date'],
               label: Translator.t('checkPoints:origin'),
               size: '15%',
               color: 'var(--fifth)',
               transform: (value) => this.createDateFormated(value)
            },
            {
               keys: ['client', 'seller'],
               label: Translator.t('checkPoints:type'),
               size: '15%',
               align: 'left',
               color: 'var(--fifth)',
               transform: (client, seller) => [
                  Sheet.bold(client).css('color', 'var(--primary)'),
                  seller
               ]
            },
            {
               keys: ['date'],
               label: Translator.t('checkPoints:name'),
               size: '15%',
               transform: () => '---'
            },
            {
               keys: ['id', 'date'],
               label: Translator.t('checkPoints:order-number'),
               size: '15%',
               transform: () => '---'
            },
            {
               keys: ['total'],
               label: Translator.t('checkPoints:total-points'),
               size: '10%',
               bold: true,
               css: (value) => ({
                  color: value > 0 ? 'var(--primary)' : 'var(--fifth)',
                  cursor: 'pointer',
               }),
               transform: (total) => [
                  Sheet.bold(total.replaceAll(".",",")), 
                  Sheet.capitalize(Sheet.desc(Translator.t('common:details')))
               ],
               onClick: (event, data) => {
                   
                  event.stopPropagation()
                  new OrderViewTab({
                     autoOpen: true,
                     draftData: data,
                     showMarkup: false,
                     isDraft: data.isDraft,
                     // isDraft: !data.status,
                     salesAdapter: new SalesSheetOrderAdapter(this.salesSheet.render, this.salesRender),
                  }) 
               },
            },
            {
               keys: ['markup', 'total'],
               label: Translator.t('checkPoints:total-orders'),
               size: '10%',
               fallback: '0,00',
               bold: true,
               transform: (markup, total) => {
                
                  return [
                     Sheet.bold((markup || total || 0.00).replaceAll(".",",")),
                     Sheet.capitalize(Sheet.desc(Translator.t('common:details')))
                  ]
                  
               },
               css: (markup) => ({
                  color: markup > 0 ? 'var(--primary)' : 'var(--fifth)',
                  cursor: 'pointer'
               }),
               onClick: (event, data) => { 
                  event.stopPropagation()
                   
                  new OrderViewTab({
                     autoOpen: true,
                     showMarkup: true,
                     draftData: data,
                     isDraft: !data.status,
                     salesAdapter: new SalesSheetOrderAdapter(this.salesSheet.render, this.salesRender)
                  })
               },
            },
              {
               keys: ['markup', 'total'],
               label: Translator.t('checkPoints:status'),
               size: '10%',
               fallback: '0,00',
               bold: true,
               transform: (markup, total) => {
                
                  return [
                     Sheet.bold((markup || total || 0.00).replaceAll(".",",")),
                     Sheet.capitalize(Sheet.desc(Translator.t('common:details')))
                  ]
                  
               },
               css: (markup) => ({
                  color: markup > 0 ? 'var(--primary)' : 'var(--fifth)',
                  cursor: 'pointer'
               }),
               onClick: (event, data) => { 
                  event.stopPropagation()
                   
                  new OrderViewTab({
                     autoOpen: true,
                     showMarkup: true,
                     draftData: data,
                     isDraft: !data.status,
                     salesAdapter: new SalesSheetOrderAdapter(this.salesSheet.render, this.salesRender)
                  })
               },
            },
            {
               keys: [],
               size: '5%',
            }
         ],
      }
   }

   /**
    * Busca e adiciona os drafts para serem visualizados 
    */
   async fetchAndAddItems() {
      if (this.queriedEverything) return
      if (this.isFetchingDrafts) return
      this.isFetchingDrafts = true
 
      try {
         const draftSearchParams = await this.getSearchAPISettings(this.currentFilters)

         console.log('draftSearchParams');
         console.log(draftSearchParams);
         // debugger
         
         const orderResponse = await APIManager.doAPIRequest(ORDER_DRAFT_SEARCH_URL, draftSearchParams)
         const allItems = (orderResponse?.itens ?? [])
         const hasOneItemAtLeast = !!allItems.length
         const gotAllItems = allItems.length === 0

         if (orderResponse.errorCode > 1) {
            throw new Error(orderResponse.errorMessage)
         }

         if (gotAllItems) {
            PopUp.triggerInfo('Parece que isso é tudo.')
            this.queriedEverything = true
            this.queriedAmount > 0
               ? this.currentRender.setBottomMessage('Parece que isso é tudo')
               : this.currentRender.setItems([])
         }

         if (hasOneItemAtLeast) {
            this.queriedAmount += allItems.length
            this.allItems.push(...allItems)

            // console.log(allItems);
            // debugger
            
            this.currentRender.addItems(...allItems)
         }

         if (Object.keys(this.currentFilters).length) {
            this.moneyViewer.updateDesc(`TOTAL (${orderResponse?.value?.count ?? 0}) (Com Filtros)`)
         }

         this.moneyViewer.updateDesc(`TOTAL (${orderResponse?.value?.count ?? 0})`)
         this.moneyViewer.updateValue(Number(orderResponse?.value?.total ?? 0))

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Parece que houve um erro ao buscar suas vendas. Contate o desenvolvedor.')
         this.currentRender.setItems([])
         this.currentRender.setupFailMessage('Parece que algo de errado.')

      } finally { 
         this.isFetchingDrafts = false
      }
   }

   /**
    * Pega a soma total dos valores do orçamento e atualiza a UI
    */
   updateDraftTotalMoney() {
      const allDraftTotals = this.allItems.map(draft => Number(draft.total)).filter(value => !isNaN(value))
      const summedTotal = allDraftTotals.reduce((total, draftTotal) => total += draftTotal, 0)

      this.moneyViewer.updateValue(summedTotal)
   }

   /**
    * Retorna o maior e o menor preço do array de Orçamentos 
    */
   getCurrentDraftMinMaxPrice() {
      const draftsPriceArray = this.allItems.map(({ total }) => Number(total))
      const highestPrice = Math.max(...draftsPriceArray)
      const lowestPrice = Math.min(...draftsPriceArray)
      const useRegisteredPrice = isFinite(highestPrice) && this.highestPriceFound > highestPrice

      if (!useRegisteredPrice) {
         this.highestPriceFound = highestPrice
      }

      return {
         max: useRegisteredPrice ? this.highestPriceFound : isFinite(highestPrice) ? highestPrice : 5000,
         min: isFinite(lowestPrice) && lowestPrice !== lowestPrice ? lowestPrice : 0
      }
   }

   /**
    * Pega a data mais antiga e a data mais recente do array de Orçamentos
    */
   getCurrentDraftMinMaxDate() {
      const draftsDateArray = this.allItems.map(({ date }) => new Date(date.split(' ')[0]).getTime())
      const draftNewestDate = Math.max(...draftsDateArray)
      const draftFarthestDate = Math.min(...draftsDateArray)

      return {
         end: isFinite(draftNewestDate) ? new Date(draftNewestDate).toISOString().split('T')[0] : '',
         start: isFinite(draftFarthestDate) ? new Date(draftFarthestDate).toISOString().split('T')[0] : ''
      }
   }

   /**
    * Retorna os próximos parâmetros para serem buscados pela api 
    */
   async getSearchAPISettings({
      search,
      date = { start: '2022-01-01', end: this.getFormatedTodayDate() },
      price = { min: 0, max: 999999 },
      orderType,
      status,
      // searchScope
   } = {}) {

      const [sellerType, sellerID, memberID] = await Promise.all([
         UserStorage.getSellerInfo('type'),
         UserStorage.getSellerInfo('id'),
         UserStorage.getMemberInfo('id')
      ])

      const statuses = Object.values(this.statuses)
      // const statusIds = (status ?? []).map(name => statuses.find(st => st.name === name)).map(st => st.id).join(',')
      const statusIds = (status ?? []).map(name => statuses.find(st => st.name === name)).map(st => st.code).join(',')
      const keyToUse = Number(sellerType) === 2 ? 'manager' : 'seller'
      const userIdObject = { [keyToUse]: sellerID }
      const limitToUse = {
         start: this.queriedAmount,
         end: this.salesByQuery
      }
  
      return {
         type: status ? 'order' : orderType === 'Apenas orçamentos' ? 'draft' : orderType === 'Apenas vendas' ? 'order' : 'mix',
         application: APPLICATION,
         member: memberID,
         limit: limitToUse,
         date: date,
         price: price,
         status: statusIds,
         // searchScope:searchScope??null,
         ...(search && { search }),
         ...userIdObject
      }
   }

   /**
    * Pega a data atual formatada 
    */
   getFormatedTodayDate() {
      return new Date()
         .toLocaleDateString()
         .split('/')
         .reverse()
         .join('-')
   }

   /**
    * Retorna uma data com horário formatada
    */
   createDateFormated(date) {
      const formatedDate = date
         .split(' ')[0]
         .split('-')
         .reverse()
         .join('/')

      const formatedHour = date
         .split(' ')[1]
         .split(':')
         .slice(0, 2)
         .join(':')

      return [Sheet.bold(formatedDate).css('color', 'var(--primary)'), formatedHour]
   }

   /**
    * Retorna uma badge com o status, caso não achar o status retorna a de "Em orçamento"
    */
   createStatusBadge(statusID) {
      const status = Object.values(this.statuses).find((st) => st.code == statusID);
        
      return new Badge({
         transform: [0, 0],
         round: false,
         static: true,
         fontSize: 17, 
         hasIcon: false, 
         // title: this.statuses[statusID]?.name ?? 'Em orçamento', //aqui
         // color: this.statuses[statusID]?.background ?? 'var(--fifth)', 
         title: status?.name ?? 'Em orçamento',
         color: status?.background?? 'var(--fifth)',
         style: { margin: '0 auto', minWidth: '105px', padding: '0.5rem 0.6rem' }
      }).getView()
   } 

   /**
    * Reseta os estados e da busca e busca mais drafts 
    */
   async filterSales(filterData) {
      this.queriedEverything = false
      this.queriedAmount = 0
      this.allItems = []
      this.currentFilters = filterData
      this.currentRender?.bottomMessage?.remove()
      this.salesSheet?.master?.scrollTop(0)
      this.currentRender?.setItems([])
 
      
      await this.fetchAndAddItems()
   }

   /**
    * Configuração dos filtros 
    */
   getFilterTabConfig() {
      return {
         destroy: false,
         autoOpen: true,
         filterButton: this.filterBtn,
         filters: {
            type: 'checkPoints',
            callback: this.filterSales.bind(this),
         }
      }
   }

   /**
    * Configuração da Render
    */
   getRendererConfig() {
      return {
         items: [],
         identifierKey: 'identifier',
         hasGoToTopButton: true,
         hasAnimation: true,
         rowGap: '0.75rem',
         css: 'hasMarginTop',
         messageOnEmpty: 'Não encontramos nenhum orçamento. Verifique os filtros.',
         createFunc: (orderData, index) => this.createOrder(orderData, index),
         whenScrollHitBottom: () => this.fetchAndAddItems()
      }
   } 

   createOrder({ building, client, date, id, identifier, seller, status, token, total }, index) {

      
       
      const orderMoney = new MoneyViewer({ value: total, color: Number(total) > 0 ? 'var(--primary)' : 'var(--fifth)' })
      // const statusToUse = this.statuses[status] ?? { background: 'var(--fifth)', name: 'Em orçamento' }
      const statusToUse = Object.values(this.statuses).find((st) => st.code == status) ?? { background: 'var(--fifth)', name: 'Em orçamento' };
      const dateFormated = date.split(' ')[0].split('-').reverse().join('/')

      return new Item({
         onClick: () => {
            alert()
            new OrderViewTab({ draftData: arguments[0], isDraft: status == null }).open()},
         columns: ['2fr', '0px', 'min-content'],
         style: {
            item: {
               cursor: 'pointer'
            },
            right: {
               alignItems: 'flex-end',
               justifyContent: 'flex-end',
            }
         },
         header: [
            Item.brand('#' + (id)),
            Item.row(
               Item.desc(dateFormated),
               Item.tag(statusToUse.name, statusToUse.background),
            )
         ],
         left: [
            Item.title(client),
            Item.desc(seller)
         ],
         right: [
            Item.space(1),
            orderMoney.getView(),
         ]
      }).getView()
   }

   /**
    * Tenta finqlizar uma venda remotamente
    */
   tryToFinishOrder({ identifier }, callback) {
      const loadingModal = new LoadingModal({ autoOpen: true, message: 'Estamos __buscando__ seu orçamento...' })
      const hiddenCart = new CartTab({
         draftID: identifier,
         isRemote: true,
         onDraftPriceChange: () => {
            loadingModal.closeModal()

            if (hiddenCart.products.length === 0) {
               PopUp.triggerFail('Não há nenhum produto dentro deste orçamento.', null, 'NO_PRODUCT_ON_CART')
               return
            }

            hiddenCart.proceedToFinishDraft()
         },
         onDraftFinish: (identifier) => {
            const newStatus = 16
            const currentDate = new Date().toLocaleString('en-GB')
            const newDate = currentDate.split(', ')[0].split('/').reverse().join('-') + ' ' + currentDate.split(', ')[1]
            const orderData = { ...arguments[0], status: newStatus, date: newDate }

            this.currentRender.editItem(identifier, orderData)

            PopUp.triggerSuccess('Orçamento finalizado com sucesso!')

            if (callback) callback(orderData)
         }
      })
   }

   /**
    * Cria uma linha da tabela 
    */
   createTableRow(data, index, array) {

      //Vai pra aba de editar o draft
      const goToOrderEdit = () => {
         Session.set('openCartAuto', true)
         Session.set('currentDraftID', data.identifier)
         Session.set('currentDraftIndex', data.id)
         window.location.href = './catalog.html'
      }

      //Criando a linha
      const tableRow = this.salesSheet.createBodyItem(data)
      const lastTd = tableRow.children(':last-child')

      tableRow.css('z-index', array.length - index)

      if (!data.status) {
         lastTd.append(new DotsMenu({
            menuIndex: 10,
            zIndex: '',
            options: [
               {
                  text: Translator.t('actions:edit'),
                  onClick: () => goToOrderEdit()
               },
               {
                  text: Translator.t('actions:finish'),
                  onClick: () => {
                     const identifier = String(data.identifier)
                     const prompt = new OrderClosePrompt(identifier)

                     prompt.setOnSuccess(() => {
                        const newTime = new Date()
                           .toLocaleString('en-GB')
                           .replaceAll('/', '-')
                           .replaceAll(',', '')

                        const newStatus = 16
                        const newRow = { ...data, date: newTime, status: newStatus }

                        this.currentRender.editItem(identifier, newRow)
                     })

                     prompt.show()
                  }
               },
               {
                  text: Translator.t('actions:delete'),
                  color: 'var(--red)',
                  isBold: true,
                  onClick: () => {
                     
                     const identifier = String(data.identifier)
                     const prompt = new OrderDeletionPrompt(identifier)

                     prompt.setOnSuccess(() => this.currentRender.deleteItem(identifier))
                     prompt.show()
                  }
               }
            ]
         }).getView())
      }

      return tableRow
   }

   /**
    * Configuração do valor total das vendas
    */
   getMoneyViewerConfig() {
      return {
         description: Translator.t('common:total'),
         value: 0,
         css: 'isSaleMoneyViewer',
         hideCents: false
      }
   }
}

Initializer.initialize(() => new SalesController())