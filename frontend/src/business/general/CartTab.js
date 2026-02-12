import Tab from '../../components/Tab.js'
import Renderer from '../../core/Renderer.js'
import MoneyViewer from '../../core/MoneyViewer.js'
import Modal from '../../core/Modal.js'
import Session from '../../core/Session.js'
import LoadingModal from './LoadingModal.js'
import PopUp from '../../core/PopUp.js'
import DotsMenu from '../../core/DotsMenu.js'
import { Button, Icon, P } from '../../utils/Prototypes.js'
import DataCart from '../../system/DataCart.js'
import CartItem from './CartItem.js'
import OrderService from '../../system/cart/OrderService.js'
import OrderClosePrompt from '../../system/prompts/OrderClosePrompt.js'
import ProductClonePrompt from '../../system/prompts/ProductClonePrompt.js'
import Translator from '../../translation/Translator.js'

export default class CartTab extends Tab {
   constructor(config) {

      const title = Translator.tC('common:draft')
      const draftIndex = Session.get('currentDraftIndex')

      super({
         title: `${title} <span>${draftIndex ? '#' + draftIndex : ''}</span>`,
         desc: Translator.tC('areas:description:cart'),
         rightButtonText: Translator.t('actions:finish'),
         hasLeftButton: false,
         css: 'hasContentSidePadding',
         scrollable: true,
         onRightButtonClick: () => this.promptOrderCloseConfirmation(),
         ...config
      })

      //Dados
      this.draftID = Session.get('currentDraftID') ?? this.config.draftID
      this.onProductEdit = config.onProductEdit
      this.onDraftPriceChange = config.onDraftPriceChange
      this.products = []

      //Elementos
      this.totalPrice = new MoneyViewer({ description: 'Total', value: 0, css: 'isDraftMoneyViewer' })

      //Botão de excluir tudo
      this.trashButton = new Icon('SP__header__options__icon ic-trash')

      //Render de produtos
      this.cartRender = new Renderer({
         items: [],
         rowGap: '1rem',
         css: 'isCartTabRender noInnerPadding',
         identifierKey: 'identifier',
         hasAnimation: true,
         hasGoToTopButton: false,
         messageOnEmpty: 'Você não possui nenhum item adicionado neste orçamento.',
         createFunc: (data, index, array) => this.createCartItem(data, index, array),
         sortFunc: (items) => items.sort((itemA, itemB) => itemA.time - itemB.time)
      })

      //Leitor de pastas
      this.order = new OrderService(this.draftID)

      //Configurando
      this.rightButton.attr('disabled', true)

      //Eventos
      this.trashButton.click(() => this.promptCartClearConfirmation())

      //Motando
      this.appendToContent(this.cartRender.getView())
      this.prependToOptions(this.trashButton)
      this.prependToFooter(this.totalPrice.getView())
      this.fetchAndAddProducts()
   }

   /**
    * Tenta buscar e adicionar os produtos 
    */
   async fetchAndAddProducts() {
      try {

         const products = await this.order.getProducts()
         const isEmpty = !products.length

         if (isEmpty) {
            this.clearCartRender()
            this.updateCartUI()
            return
         }

         this.cartRender.setItems(products)

         this.updateCartUI()

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Parece que houve um erro ao baixar os produtos deste orçamento. Contate o desenvolvedor.', this.tab)

      }
   }

   /**
    * Scrolla para a fundo do carrinho
    */
   scrollToBottomOfContent() {
      this.content[0].scrollTo(0, this.content[0].scrollHeight)
   }

   /**
    * Abre a confirmação de finalizar o orçamento
    */
   promptOrderCloseConfirmation() {
      const prompt = new OrderClosePrompt(this.draftID)

      prompt.setOnSuccess(() => {
         this.openDraftFinishedModal()
         return false
      })

      prompt.show()
   }

   /**
    * Altera a UI do carrinho
    */
   updateCartUI() {
      this.updateTabMoney()
      this.updateRenderHeight()
      this.updateCartButtons()
      this.updateConfirmButton()
   }

   /**
    * Atualiza a quantia de dinheiro
    */
   updateTabMoney() {
      const total = this.cartRender
         .getItems()
         .reduce((total, product) => total + Number(product.extract.total ?? 0), 0)

      this.totalPrice.updateValue(total)
      
      this.onDraftPriceChange(total)
   }

   /**
    * Atualiza o tamanho da altura da render de produtos
    */
   updateRenderHeight() {
      if (this.isCartEmpty()) {

         this.cartRender.getView().css('height', '100%')

      } else {

         this.cartRender.getView().css('height', 'min-content')

      }
   }

   /**
    * Atualiza o botão de confirmar
    */
   updateConfirmButton() {
      this.rightButton.attr('disabled', this.isCartEmpty())
   }

   /**
    * Atualiza os botões presentes no carrinho
    */
   updateCartButtons() {
      this.clearCartButtons()

      const addProductButton = this.createCartButton({
         message: Translator.tC('actions:add-product'),
         icon: 'ic-add',
         onClick: () => this.close()
      })

      this.appendToContent(addProductButton)
   }

   /**
    * Limpa os botões do carrinho
    */
   clearCartButtons() {
      this.content.find('[data-cart-button]').remove()
   }

   /**
    * Cria uma mensagem de "Adicionar mais produtos"
    * @param {object} config A configuração do botão
    * @returns {JQuery<HTMLButtonElement>} O botão
    */
   createCartButton({
      message = '',
      background = '',
      color = '',
      icon = 'add',
      onClick = () => { },
   }) {
      const buttonWrapper = new Button('SP__cartButton')
      const buttonText = new P('SP__cartButton__text')
      const buttonIcon = new Icon('SP__cartButton__icon')

      buttonWrapper.attr('data-cart-button', true)
      buttonText.text(message)
      buttonIcon.addClass(icon)
      buttonWrapper.append(buttonText, buttonIcon)
      buttonWrapper.click(() => onClick())

      if (background) buttonWrapper.css('background-color', background)
      if (color) buttonText.css('color', color)

      return buttonWrapper
   }

   /**
    * Retorna se o carrinho está vazio
    * @returns {boolean} Se está vazio
    */
   isCartEmpty() {
      return this.getCartProducts().length === 0
   }

   /**
    * Retorna a lista de produtos no carrinho atualmente
    * @returns {object[]} A lista de produtos
    */
   getCartProducts() {
      return this.cartRender.getItems()
   }

   /**
    * Retorna se há produtos no carrinho
    * @returns {boolean} Se há produtos
    */
   hasProductOnCart() {
      return this.getCartProducts().length > 0
   }

   /**
    * Abre o modal de configra
    */
   openDraftFinishedModal() {
      new Modal({

         onBackspace: () => location.href = '/sales.html',
         onEscape: () => location.href = '/sales.html',
         onEnter: () => window.location = `/view.html?d=${this.draftID}`,
         canBeClosed: false,
         color: 'var(--green)',
         icon: 'ic-check',
         autoOpen: true,
         title: 'Orçamento __Finalizado!__',
         message: 'Clique no botão abaixo caso queira visualizá-lo.',
         buttons: [{
            type: 'blank',
            text: 'Voltar',
            closeOnClick: false,
            onClick: () => location.href = '/sales.html'
         }, {
            type: 'filled',
            text: 'Visualizar',
            color: 'var(--green)',
            closeOnClick: false,
            onClick: () => window.location = `/view.html?d=${this.draftID}`
         }]
      })
   }

   /**
    * Formata como preço 
    */
   formatAsPrice(price) {
      return Number(price).toFixed(2)
   }

   /**
    * Tenta abrir o modal de deletar todos os produtos do carrinho 
    */
   promptCartClearConfirmation() {
      if (!this.hasProductOnCart()) {
         PopUp.triggerInfo('Você não possui nenhum item no carrinho.', this.tab, 'NO_ITEM_ON_CART')
         return
      }

      new Modal({
         onEscape: (modal) => modal.closeModal(),
         onBackspace: (modal) => modal.closeModal(),
         onEnter: () => this.clearDraftItems(),
         icon: 'ic-trash',
         color: 'var(--red)',
         autoOpen: true,
         title: 'Limpar Orçamento?',
         message: 'Tem certeza que deseja __deletar__ todos os items de seu orçamento? Essa ação é __irreversível__.',
         buttons: [{
            type: 'blank',
            text: 'Cancelar',
         }, {
            type: 'filled',
            text: 'Excluir',
            color: 'var(--red)',
            icon: 'ic-trash',
            onClick: () => this.clearDraftItems()
         }]
      })
   }

   /**
    * Limpa todos arquivos da pastra do draft
    */
   async clearDraftItems() {
      const loadingModal = new LoadingModal({
         title: 'Aguarde',
         message: 'Estamos __limpando__ seu carrinho.',
         autoOpen: true
      })

      try {

         await this.order.deleteAllProducts()

         this.clearCartRender()
         this.updateCartUI()

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Houve um erro ao tentar deletar um produto', this.tab)

      } finally {

         loadingModal.closeModal()

      }
   }

   /**
    * Limpa todos os items da renderizadora do carrinho
    */
   clearCartRender() {
      this.cartRender.setItems([])
   }

   /**
    * Cria um item do carrinho
    * @param {object} product Os dados do produto
    * @param {number} index O índice do produto no carrinho
    * @param {object[]} allProducts A lista de produtos   
    */
   createCartItem(product, index, allProducts) {
      const menu = new DotsMenu(this.getCartItemMenuConfiguration(product, allProducts))
      const dataCart = new DataCart(product)
      const cartItem = new CartItem({
         dataCart,
         index,
         menu
      })

      return cartItem.getView()
   }

   /**
    * Retorna a configuração do menu do item do carrinho
    * @param {DataCart} product O produto
    * @param {DataCart[]} allProducts Todos os produtos
    * @returns {object} A configuração
    */
   getCartItemMenuConfiguration(product) {
      return {
         iconSize: 20,
         options: [
            {
               text: Translator.tC('actions:edit'),
               onClick: () => this.onProductEdit(product)
            },
            {
               text: Translator.tC('actions:duplicate'),
               onClick: () => this.promptProductClone(product)
            },
            {
               text: Translator.tC('actions:delete'),
               color: 'var(--red)',
               isBold: true,
               onClick: () => this.promptProductDeleteConfirmation(product)
            },
         ]
      }
   }

   /**
    * Mostra o prompt para clonar um produto
    */
   promptProductClone(product){
      const prompt = new ProductClonePrompt(product, this.draftID)

      prompt.setOnSuccess((clonedProducts) => {
         this.cartRender.addItems(...clonedProducts)
      })

      prompt.show()
   }

   /** 
    * Abre o modal de confirmação de delete do produto 
    */
   promptProductDeleteConfirmation(product) {
      new Modal({
         onEscape: (modal) => modal.closeModal(),
         onBackspace: (modal) => modal.closeModal(),
         onEnter: () => this.deleteProduct(product),
         icon: 'ic-trash',
         color: 'var(--red)',
         title: 'Atenção!',
         autoOpen: true,
         message: 'Deseja __excluir__ este produto de seu orçamento? Essa ação é __irreversível__.',
         buttons: [{
            type: 'blank',
            text: 'Cancelar',
         }, {
            type: 'filled',
            text: 'Excluir',
            color: 'var(--red)',
            onClick: () => this.deleteProduct(product)
         }]
      })
   }

   /**
    * Deleta um produto da order e posteriormente do bucket ]
    * @param {object} product O produto
    * @returns {Promise<void>} O tempo até a resposta final 
    */
   async deleteProduct(product) {
      const loadingModal = new LoadingModal({
         title: 'Aguarde',
         message: 'Estamos __excluindo__ este produto.',
         autoOpen: true
      })

      try {

         await this.order.deleteProduct(product)

         this.cartRender.deleteItem(product.identifier)

         this.updateCartUI()

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Houve um erro ao deletar o seu produto.', this.tab)

      } finally {

         loadingModal.closeModal()

      }
   }
}
