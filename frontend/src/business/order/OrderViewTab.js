import Tab from '../../components/Tab.js'
import Session from '../../core/Session.js'
import Renderer from '../../core/Renderer.js'
import MoneyViewer from '../../core/MoneyViewer.js'
import APIManager from '../../api/APIManager.js'
import DotsMenu from '../../core/DotsMenu.js'
import PopUp from '../../core/PopUp.js'
import OrderFinishTab from './OrderFinishTab.js'
import Dropdown from '../../core/Dropdown.js'
import Item from '../../core/Item.js'
import { Div, Icon, H4 } from '../../utils/Prototypes.js'
import Badge from '../../core/Badge.js'
import CartItem from '../../business/general/CartItem.js'
import Tooltip from '../../core/Tooltip.js'
import UserStorage from '../../core/UserStorage.js'
import DataCart from '../../system/DataCart.js'
import OrderService from '../../system/cart/OrderService.js'
import OrderDeletionPrompt from '../../system/prompts/OrderDeletionPrompt.js'
import OrderClosePrompt from '../../system/prompts/OrderClosePrompt.js'
import Translator from '../../translation/Translator.js'
import Utils from '../../core/Utils.js'

export default class OrderViewTab extends Tab {
   constructor(config) {
      super({
         hasDesc: false,
         hasInfo: false,
         hasTitle: false,
         hasLeftButton: false,
         hasRightButton: false,
         hasClose: true,
         ...config
      })      

      //Pegando os dados
      this.orderData = this.config.draftData
      this.identifier = this.config.draftData.identifier
      this.isDraft = this.config.isDraft
      this.showMarkup = this.config.showMarkup
      this.salesAdapter = this.config.salesAdapter

      const orderDate = Item.desc(`#${this.orderData.id} - ${this.getDateFormated(this.orderData.date)}`)

      orderDate.css('width', 'fit-content')

      new Badge({
         on: orderDate,
         color: this.showMarkup ? 'var(--fifth)' : 'transparent',
         textColor: this.showMarkup ? 'white' : 'var(--fifth)',
         border: this.showMarkup ? 'transparent' : 'var(--fifth)',
         title: this.showMarkup ? 'Pedido' : 'Cotação',
         round: false,
         padding: '0.25rem',
         top: 50,
         left: 105,
         hasIcon: false,
         transform: [0, '-50%']
      })

      //Criando o item do header
      this.headerItem = new Item({
         columns: ['1fr', '0px', '0px'],
         css: 'isMedium',
         style: {
            item: {
               border: 'none',
               paddingBottom: '0.5rem'
            },
            left: {
               rowGap: '0.5rem'
            },
            main: {
               padding: '0'
            }
         },
         left: [
            orderDate,
            Item.title(this.orderData.client),
            Item.desc(this.orderData.seller),
         ]
      })

      this.optionsMenu = new DotsMenu({
         iconSize: 24,
         color: 'var(--fifth)',
         style: { marginTop: '4px' },
         options: [
            {
               text: Translator.t('actions:edit'),
               color: 'var(--primary)',
               onClick: () => this.goToEditDraft()
            },
            {
               text: Translator.t('actions:finish'),
               color: 'var(--primary)',
               onClick: () => this.promptCloseConfirmation()
            },
            {
               color: 'var(--red)',
               isBold: true,
               text: Translator.t('actions:delete'),
               onClick: () => this.promptDeletionConfirmation()
            }
         ]
      })

      //Botões do header
      this.editBtn = new Icon('SP__header__options__icon ic-edit')
      this.deleteBtn = new Icon('SP__header__options__icon ic-trash')
      this.confirmBtn = new Icon('SP__header__options__icon ic-check')
      this.viewBtn = new Icon('SP__header__options__icon ic-document')

      //Quando clicar normalmente
      this.viewBtn.click((event) => this.handleViewOrderClick(event))

      //Ativando as tooltips dos botões
      this.activateTooltips()

      //Visualizador de preço total
      this.orderMoney = new MoneyViewer({
         value: 0,
         description: Translator.t('common:total'),
      })

      //A render de todos os produtos
      this.productsRender = new Renderer({
         hasLoader: true,
         css: 'isSaleViewRender',
         messageOnEmpty: 'Esse orçamento não possui nenhum produto',
         items: [],
         rowGap: '1rem',
         hasAnimation: false,
         hasGoToTopButton: false,
         createFunc: (data, index, array) => this.createSaleItem(data, index, array),
         sortFunc: (items) => items.sort((itemA, itemB) => itemA.time - itemB.time)
      })

      //Dados
      this.storedData = {}
      this.products = []
      this.isSimulator = false
      
      // console.log(this.orderData);
      // debugger
      
      //Criado os folder managers
      this.order = new OrderService(this.orderData.identifier, this.orderData.isDraft)

      //Configurano
      this.header.addClass('isOrderView')
      this.content.addClass('isOrderView')

      //Motnando
      this.isDraft
         ? this.prependToOptions(this.optionsMenu.getView())
         : this.prependToOptions(this.viewBtn)

      this.prependToHeader(this.headerItem.getView())
      this.appendToFooter(this.orderMoney.getView())
      this.initialize()
   }
   

   /**
    * Inicializa a aba buscando todos os items
    */
   async initialize() {
      try {

         [this.storedData, this.products] = await Promise.all([
            this.order.getData(),
            this.order.getProducts()
         ]);

         [this.statuses, this.isSimulator] = await Promise.all([
            APIManager.getRepository('status'),
            UserStorage.isUserSimulator()
         ])

         this.setupStatusTag()
         this.setupTotalPrice()
         this.setupBuyerCard()
         this.setupProductsList()
         this.setupSellerCard()

         this.productsRender.setItems(this.products)

      } catch (error) {

         console.error(error)
         this.content.empty()
         PopUp.triggerFail('Parece que algo deu errado ao buscar a venda. Contate o desenvolvedor.', this.tab)

      }
   }

   /**
    * Mostra a mensagem de fechar o orçamento
    */
   promptCloseConfirmation(){
      const prompt = new OrderClosePrompt(this.identifier)

      prompt.setOnSuccess(() => {
         this.handleOrderClose()
         this.close()
         
         return false
      })

      prompt.show()
   }

   /**
    * Lida com o fechamento do pedido
    */
   handleOrderClose(){
      this.close()

      const newStats = 16
      const newDate = new Date()
         .toLocaleString('en-GB')
         .replaceAll('/', '-')
         .replaceAll(',', '')

      const newOrderData = {
         ...this.orderData,
         status: newStats,
         date: newDate
      }
      console.log(newOrderData);
      

      if(this.salesAdapter){
         this.salesAdapter.edit(newOrderData.identifier, newOrderData)
      }

      new OrderViewTab({
         autoOpen: true,
         draftData: newOrderData,
         isDraft: false,
         showMarkup: this.showMarkup,
         salesAdapter: this.salesAdapter
      })
   }

   /**
    * Define a tag de status do pedido
    */
   setupStatusTag() {
      const status = this.statuses.find(status => {
         return status.code === this.orderData.status
      })

      const statusItem = new Div('SP__status')
      const statusBackground = status?.background ?? 'var(--fifth)'
      const statusName = status?.name ?? 'Em orçamento'

      statusItem.css('background-color', statusBackground)
      statusItem.text(statusName)

      this.appendToFooter(statusItem)
   }

   /**
    * Define o preço total do produto
    */
   setupTotalPrice() {
      const total = this.products.reduce((total, product) => {
         return total + Number(product.extract[this.showMarkup ? 'markuped' : 'total'])
      }, 0)
      
      this.orderMoney.updateValue(total)
   }

   /**
    * Define o cartão do usuário
    */
   setupBuyerCard() {
     
      // const card = this.createPersonCard(this.storedData.order.order.buyer)
      const card = this.createPersonCard(this.storedData.buyer) 

      const dropdown = new Dropdown({
         css: 'isOrderDetailsDropdown',
         title: Translator.tC('common:customer'),
         open: true,
         gap: '0.5rem',
         appendToContent: card
      })

      dropdown.getView().css('z-index', 3)
      dropdown.getView().css('animation-delay', '0ms')

      setTimeout(() => {
         dropdown.update()
      })

      this.appendToContent(dropdown.getView())
   }

   /**
    * Define a lista de produtos do pedido
    */
   setupProductsList() {
      const dropdown = new Dropdown({
         css: 'isOrderDetailsDropdown',
         title: Translator.tC('common:product', { count: 2 }),
         open: true,
         gap: '0.5rem',
         appendToContent: this.productsRender.getView()
      })

      dropdown.getView().css('z-index', 2)
      dropdown.getView().css('animation-delay', '150ms')

      setTimeout(() => {
         dropdown.update()
      })

      this.appendToContent(dropdown.getView())
   }

   /**
    * Define o cartão do vendedor
    */
   setupSellerCard() {
      // const card = this.createPersonCard(this.storedData.order.order.seller)
      const card = this.createPersonCard(this.storedData.seller)
      const dropdown = new Dropdown({
         css: 'isOrderDetailsDropdown',
         title: Translator.tC('common:seller'),
         open: true,
         gap: '0.5rem',
         appendToContent: card
      })

      dropdown.getView().css('z-index', 1)
      dropdown.getView().css('animation-delay', '300ms')

      setTimeout(() => {
         dropdown.update()
      })

      this.appendToContent(dropdown.getView())
   }

   /**
    * Mostra a mensagem de confirmação para deletar o pedido
    */
   promptDeletionConfirmation() {
      const identifier = String(this.identifier)
      const prompt = new OrderDeletionPrompt(identifier)

      prompt.setOnSuccess(() => {
         this.close()
         this.tryToRemoveOrderFromSalesTable()
      })
 
      prompt.show()
   }

   /**
    * Tenta remover o pedido da tabela de pedidos caso possuir um adaptador
    */
   tryToRemoveOrderFromSalesTable(){
      if (this.salesAdapter) {
         this.salesAdapter.delete(this.identifier)
      }
   }

   /**
    * Lida com o clique no botão de visualizar
    * @param {MouseEvent} event O evento de clique    *  
    */
   handleViewOrderClick(event) {
      const pressedCtrl = event.ctrlKey
      const hasData = !!Object.keys(this.storedData).length

      if (!hasData) {
         PopUp.triggerInfo('Um momento, estamos buscando a venda.', null, 'LOADING_MESSAGE')
         return
      }

      if (pressedCtrl) {
         window.location.href = `/view.html?d=${this.orderData.identifier}`
         return
      }

      this.openOrderFinishTab()
   }

   /**
    * Retorna a data que foi salva no banco como apenas o dia1 
    */
   getDateFormated(date) {
      return String(date).split(' ')[0].split('-').reverse().join('/')
   }

   /**
    * Coloca as tooltips nos botões
    */
   activateTooltips() {
      const configuration = [
         {
            text: 'Editar',
            target: this.editBtn,
            background: 'var(--fifth)'
         },
         {
            text: 'Excluir',
            target: this.deleteBtn,
            background: 'var(--red)'
         },
         {
            text: 'Finalizar',
            target: this.confirmBtn,
            background: 'var(--green)'
         },
         {
            text: 'Visualizar',
            target: this.viewBtn,
            background: 'var(--fifth)'
         },
      ]

      configuration.forEach(tooltipData => {
         new Tooltip({
            on: tooltipData.target,
            background: tooltipData.background,
            content: Tooltip.text(tooltipData.text)
         })
      })
   }

   /**
    * Cria um card com os dados do cliente
    */
   createPersonCard({ name, document, email, phone }) {
      const buyerWrapper = new Div('SP__buyer')
      const buyerTitle = new H4('SP__buyer__title')
      const buyerInfo = new Div('SP__buyer__info')

      buyerTitle.text(name)
      buyerWrapper.append(buyerTitle, buyerInfo)

      const buyerInfoRows = [
         { 
            label: Translator.tC('common:document'),
            icon: 'ic-document-user', 
            text: this.formatDocument(document) ?? Translator.tC('empty:document'), 
            hasInfo: !!document 
         },
         { 
            label: Translator.tC('common:phone'), 
            icon: 'ic-phone', 
            text: phone || Translator.tC('empty:phone'), 
            hasInfo: !!phone 
         },
         { 
            label: Translator.tC('common:email'), 
            icon: 'ic-email', 
            text: email || Translator.tC('empty:email'), 
            hasInfo: !!email 
         }
      ]

      buyerInfoRows.forEach(({ icon, text, label, hasInfo }) => {

         const item = new Div('SP__buyer__info__item')
         const itemIcon = new Icon('SP__buyer__info__item__icon')
         const itemText = new Div('SP__buyer__info__item__text')

         item.attr('data-copy-label', '// ' + Translator.tC('actions:copy'))
         item.attr('data-info', hasInfo)
         itemIcon.addClass(icon)
         itemText.text(text)
         item.append(itemIcon, itemText)
         buyerInfo.append(item)

         item.click(() => {
            if (!hasInfo) return
            navigator.clipboard.writeText(text)
            PopUp.triggerCopy(`${label} copiado com sucesso`, this.tab, 'BUYER_INFO_COPY')
         })
      })

      return buyerWrapper
   }

   /**
    * Recebe uma string e a formata para um CPF com traços e pontos 
    */
   formatDocument(document) {
      if (!document) return null

      return document.replace(/\D/gi, '').split('').map((number, index) => {
         if (index === 2) return number + '.'
         if (index === 5) return number + '.'
         if (index === 8) return number + '-'
         return number
      }).join('')
   }

   /**
    * Cria um produto do orçamento e retorna para visualização 
    */
   createSaleItem(product, index, array) {
      const dataCart = new DataCart(product)

      const cartProps = {
         dataCart,
         index,
      }

      if(this.getOptionsForProduct().length){
         cartProps.menu = new DotsMenu({
            options: this.getOptionsForProduct(dataCart)
         })
      }

      const cartItem = new CartItem(cartProps)

      return cartItem.getView()
   }

   /**
    * Retorna as opções para um produto
    * @param {DataCart} product O produto 
    * @returns {object[]} As opções para o menu de um produto
    */
   getOptionsForProduct(product) {
      const options = []

      if (this.isDraft) {
         options.unshift({
            text: Translator.tC('actions:edit'),
            onClick: () => this.goToEditDraft(product.getIdentifier())
         })
      }

      return options
   }


   /**
    * Vai para a aba de editar o DRAFT
    */
   goToEditDraft(productToEditIdentigier) {
      Session.set('openCartAuto', true)
      Session.set('productToAutoOpenEdit', productToEditIdentigier)
      Session.set('currentDraftID', this.identifier)
      Session.set('currentDraftIndex', this.orderData.id)
      window.location.href = './catalog.html'
   }

   /**
    * Vai para a aba de visualizar a ORDER
    */
   openOrderFinishTab() {
      new OrderFinishTab({
         autoOpen: true,
         showMarkup: this.showMarkup,
         openAnimation: 'slide',
         orderData: this.storedData,
         products: this.products
      })
   }
}