import Tab from '../components/Tab.js'
import AssemblyView from './AssemblyView.js'
import MoneyViewer from '../core/MoneyViewer.js'
import PopUp from '../core/PopUp.js'
import Session from '../core/Session.js'
import UserStorage from '../core/UserStorage.js'
import DotsMenu from '../core/DotsMenu.js'
import { ResourcesService } from './resources/ResourcesService.js'
import { ResourcesMapper } from './resources/ResourcesMapper.js'
import OrderService from './cart/OrderService.js'
import LoadingModal from '../business/general/LoadingModal.js'
import AssemblyCartAdapter from './cart/AssemblyCartAdapter.js'
import { Div, Icon } from '../utils/Prototypes.js'
import Item from '../core/Item.js'
import { limitStringWithDots } from '../helpers/limitStringWithDots.helper.js'
import { STORAGE_URL } from '../api/Variables.js'
import DataCart from './DataCart.js'
import RelatedProductsOfferHandler from './RelatedProductsOfferHandler.js'
import Translator from '../translation/Translator.js'

export default class ProductViewTab extends Tab {
   constructor(config) {
      super({
         hasTitle: false,
         hasDesc: false,
         hasLeftButton: false,
         hasInfo: false,
         rightButtonText: '',
         ...config
      })

      //Modo rápido
      this.thunderIcon = new Icon('SP__header__options__icon ic-thunder')

      //Valor do produto e tabela de preço
      this.moneyViewer = new MoneyViewer({
         value: 0,
         description: Translator.t('common:total'),
         cursor: 'pointer',
         css: 'isProductViewMoneyViewer'
      })

      //Atributos
      this.header.addClass('hasBorderBottom alignOptionsCenter')
      this.rightButton.text(this.getRightButtonText())

      //Adicionando eventos de clique
      this.rightButton.click(() => {this.handleRightButtonClick()})

      //Montando 
      this.prependToFooter(this.moneyViewer.getView())
      this.prependToHeader(this.getHeader())

      //Inicializando
      this.initialize()

   }

   /**
    * Inicializa o menu de montagem
    */
   async initialize() {
      try {

         const resources = await ResourcesService.fetch(this.getProductID())
         const organizedResources = ResourcesMapper.map(resources)

         this.resources = organizedResources

         this.setupAssemblyView(organizedResources)

      } catch (error) {

         console.error(error)
         PopUp.triggerError('Parece algo deu errado ao montar o produto.')
         this.hideLoader()

      }
   }

   /**
    * Retorna o texto que deve ser adicionado no botão direito de acordo com o que o usuário está fazendo
    * @returns {string} O texto do botão
    */
   getRightButtonText() {
      if (this.isProductEdit()) {
         return Translator.tC('actions:save')
      }
      if (this.isDoingOrder()) {
         return Translator.tC('actions:add')
      }

      return Translator.tC('actions:close')
   }

   /**
    * Lida com o clique do botão de confirmar
    */
   async handleRightButtonClick() {

      if (!this.isAssemblyMounted()) {
         this.triggerWaitLoadPopUp()
         return
      }
      if (!this.isDoingOrder()) {
         this.close()
         return
      }

      const loadingModal = new LoadingModal({
         title: 'Aguarde',
         message: 'Estamos adicionando seu produto...',
         autoOpen: true
      })

      try {
         const draftID = Session.get('currentDraftID')
         const order = new OrderService(draftID)
         const product = await this.assemblyView.getCart()

         console.log("@@@ Cart @@@");
         console.log(product);
         console.log("@@@");

         this.isProductEdit()
            ? await order.editProduct(product)
            : await order.addProduct(product)

         this.offerRelatedProducts(product)
         this.tryToUpdateCart(product)
         this.close()

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Houve um erro ao adicionar o seu produto')

      } finally {

         loadingModal.closeModal()

      }
   }

   /**
    * Oferece os produtos relacionados com este produto
    * @param {object} product O produto que foi adicionado/editado
    */
   offerRelatedProducts(product) {
      const dataCart = new DataCart(product)
      const offerHandler = new RelatedProductsOfferHandler({
         dataCart,
         cartAdapter: this.getCartAdapter()
      })

      offerHandler.handle(dataCart)
   }

   /**
    * Fecha a aba e suas abas filhas
    * @override
    */
   close() {
      this.assemblyView.datasheetTab.close()
      this.assemblyView.rulesResultTab.close()

      super.close()
   }

   /**
    * Atualiza o valor mostrado na aba
    * @param {number} money O dinheiro 
    */
   updateTabMoney(money) {
      this.moneyViewer.updateValue(money)
   }

   /**
    * Tenta atualizar o carrinho caso possuir um adaptador
    * @param {object} product O produto que foi alterado
    */
   tryToUpdateCart(product) {
      if (!this.hasCartAdapter()) {
         return
      }

      const adapter = this.getCartAdapter()
      const isEdit = this.isProductEdit()

      isEdit
         ? adapter.editProduct(product)
         : adapter.addProduct(product)

      adapter.openTab()
   }

   /**
    * Retorna se o produto possui um adaptador para um carrinho
    * @returns {boolean} Se tem ou não
    */
   hasCartAdapter() {
      return Boolean(this.getCartAdapter())
   }

   /**
    * Retorna o adaptador do carrinho
    * @returns {AssemblyCartAdapter | null} O adaptador do carrinho caso houver
    */
   getCartAdapter() {
      return this.config.cartAdapter
   }

   /**
    * Retorna é uma aba de edição de produto
    * @returns {boolean} Se é uma aba de edição de produtos
    */
   isProductEdit() {
      return Boolean(this.getProductDataForEdit())
   }

   /**
    * Retorna se esta fazendo um pedido
    * @returns {boolean} Se está fazendo
    */
   isDoingOrder() {
      return Boolean(Session.get('currentDraftID'))
   }

   /**
    * Retorna se a parte de montagem do produto foi estabelecida
    * @returns {boolean} Se foi estabelecida
    */
   isAssemblyMounted() {
      return this.assemblyView.isMounted
   }

   /**
    * Gatilha um PopUp dizendo para o usuário que o produto não foi carregado ainda
    */
   triggerWaitLoadPopUp() {
      PopUp.triggerInfo('O produto precisa carregar.', this.tab, 'WAIT_PRODUCT_LOAD')
   }

   /**
    * Monta o productView 
    */
   async setupAssemblyView(resources) {
      this.assemblyView = new AssemblyView({
         resources,
         tab: this,
         dataCart: this.getProductDataForEdit(),
         cartAdapter: this.getCartAdapter()
      })

      this.optionsMenu = new DotsMenu({
         color: 'var(--fifth)',
         icon: 'ic-gear',
         iconSize: 26,
         options: await this.getOptionsForDotsMenu()
      })

      this.thunderIcon = new Icon('SP__header__options__icon ic-flash')
      this.thunderIcon.click(() => this.toggleFastMode())

      if (Session.get('useFastModeAuto')) {
         this.thunderIcon.trigger('click')
      }

      this.appendToContent(this.assemblyView.getView())
      this.prependToOptions(this.optionsMenu.getView(), this.thunderIcon)
   }

   /**
    * Alterna o modo orçamento rápido
    */
   toggleFastMode() {
      const isFastModeActive = this.assemblyView.isFastModeActive()

      isFastModeActive
         ? this.assemblyView.useFastMode = false
         : this.assemblyView.useFastMode = true

      isFastModeActive
         ? this.thunderIcon.removeClass('isOrange animateShake')
         : this.thunderIcon.addClass('isOrange animateShake')
   }

   /**
    * Retorna as opções do tab
    * @returns {Promise<object[]>} A lista de opções
    */
   async getOptionsForDotsMenu() {
      const options = [
         {
            text: Translator.tC('actions:save-log'),
            color: 'var(--primary)',
            onClick: () => this.assemblyView.openBugFoundModal()
         }
      ]

      if (await UserStorage.isUserSimulator()) {
         options.push(...this.getOptionsForSimulatorUser())
      }

      return options
   }

   /**
    * Retorna as opções para um usuário simulador
    * @returns {object[]} As opções
    */
   getOptionsForSimulatorUser() {
      return [
         {
            text: Translator.tC('common:datasheet'),
            color: 'var(--primary)',
            onClick: () => this.assemblyView.openDatasheetTab()
         },
         {
            text: Translator.tC('common:rule_other'),
            color: 'var(--primary)',
            onClick: () => this.assemblyView.openRuleResultsTab()
         }
      ]
   }

   getHeader() {
      const container = new Div({
         display: 'grid',
         gridTemplateColumns: '60px 1fr',
         gap: '1rem'
      })

      const infoContainer = new Div({
         display: 'grid',
         alignItems: 'center',
         alignContent: 'center',
         gap: '0.25rem'
      })

      const productDescription = this.config.product.model.map(model => model.name).join(', ')


      const image = Item.image(STORAGE_URL + this.config.product.image)
      const title = Item.title(this.config.product.title)
      const description = Item.desc(limitStringWithDots(productDescription, 30))

      infoContainer.append(
         title,
         description
      )

      container.append(
         image,
         infoContainer
      )

      return container
   }

   /**
    * Retorna os dados do produto para edição
    * @returns {object | null} 
    */
   getProductDataForEdit() {
      return this.config.editData
   }

   /**
    * Retorna o ID do produto
    * @returns {number} O ID
    */
   getProductID() {
      return this.config.product.id
   }
}
