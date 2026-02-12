import { Div, P, Icon, Button, Aside, Header, H2, Ul, Footer } from '../utils/Prototypes.js'
import Loader from './Loader.js'
import $ from 'jquery'

export default class Tab {
   constructor(config) {

      //Configuração
      this.config = $.extend(true, {

         //Informações
         type: 'tab',
         title: 'Sem título',
         desc: 'Sem descrição',
         css: '',
         closeIcon: 'ic-close',
         loader: {},
         leftButtonText: 'Voltar',
         rightButtonText: 'Fechar',

         //Dados
         target: null,
         openAnimation: 'slide',
         destroy: true,
         scrollable: false,
         autoOpen: false,
         zIndex: 11,
         open: false,

         //Build
         hasHeader: true,
         hasInfo: true,
         hasTitle: true,
         hasDesc: true,
         hasOptions: true,
         hasClose: true,
         hasContent: true,
         hasFooter: true,
         hasRightButton: true,
         hasLeftButton: true,
         hasLoader: true,

         //Eventos
         onCloseIconClick: () => this.close(),
         onOverlayClick: () => this.close(),
         onLeftButtonClick: () => this.close(),
         onRightButtonClick: () => { },
         onClose: () => { },
         onOpen: () => { },

      }, config ?? {})

      //Elementos
      this.tab = new Aside('SP__page SP__tab')
      this.header = new Header('SP__header')
      this.info = new Div('SP__header__info')
      this.title = new H2('SP__header__info__title')
      this.desc = new P('SP__header__info__description')
      this.options = new Ul('SP__header__options')
      this.content = new Div('SP__content')
      this.footer = new Footer('SP__footer')
      this.leftButton = new Button('SP__footer__button isBlank')
      this.rightButton = new Button('SP__footer__button isFilled')
      this.closeButton = new Icon('SP__header__options__icon')
      this.overlay = new Div('SP__overlay')

      //Outros elementos
      this.loader = new Loader(this.getLoaderConfig())
      
      //Eventos customizados
      this.tab.on('close', (event) => this.close(event))
      this.tab.on('open', (event) => this.open(event))
      this.tab.on('transitionend', () => this.shouldRemove() && this.removeFromPage())
      

      //Eventos de clique
      this.closeButton.click(() => this.config.onCloseIconClick())
      this.overlay.click(() => this.config.onOverlayClick())
      this.rightButton.click(() => this.config.onRightButtonClick())
      this.leftButton.click(() => this.config.onLeftButtonClick())

      //Configurando
      this.tab.addClass(this.getCSS())
      this.rightButton.text(this.getRightButtonText())
      this.leftButton.text(this.getLeftButtonText())
      this.closeButton.addClass(this.getCloseIcon())
      this.title.append(this.getTitle())
      this.desc.append(this.getDescription())
      this.tab.addClass(this.getAnimationName())

      //Configurando nível
      this.tab.css('z-index', this.getZIndex())
      this.overlay.css('z-index', this.getZIndex() - 1)

      //Inicializando
      this.assemble()
      this.append()

      //Caso deve abrir automaticamente ao ser criada
      if (this.config.autoOpen) {
         this.open()
      }

      //Caso possua scroll interno
      if (this.config.scrollable) {
         this.content.css('overflow-y', 'visible')
      }
   }

   /**
    * Monta o layout da aba
    */
   assemble() {
      if (this.getConfig().hasHeader) this.tab.append(this.header)
      if (this.getConfig().hasContent) this.tab.append(this.content)
      if (this.getConfig().hasFooter) this.tab.append(this.footer)
      if (this.getConfig().hasInfo) this.header.append(this.info)
      if (this.getConfig().hasTitle) this.info.append(this.title)
      if (this.getConfig().hasDesc) this.info.append(this.desc)
      if (this.getConfig().hasOptions) this.header.append(this.options)
      if (this.getConfig().hasLeftButton) this.footer.append(this.leftButton)
      if (this.getConfig().hasRightButton) this.footer.append(this.rightButton)
      if (this.getConfig().hasLoader) this.content.append(this.loader.getView())
      if (this.getConfig().hasClose) this.options.append(this.closeButton)
   }


   /**
    * Retorna a string de classes CSS
    * @returns {string} As classes CSS
    */
   getCSS() {
      return this.getConfig().css
   }

   /**
    * Retorna a configuração da classe
    * @returns {object} A configuração
    */
   getConfig() {
      return this.config
   }

   /**
    * Retorna o texto do botão direito
    * @returns {string} O texto
    */
   getRightButtonText() {
      return this.getConfig().rightButtonText
   }

   /**
    * Retorna o texto do botão esquerdo
    * @returns {string} O texto
    */
   getLeftButtonText() {
      return this.getConfig().leftButtonText
   }

   /**
    * Retorna o ícone que será usado para fechar
    * @returns {string} O ícone a ser usado
    */
   getCloseIcon() {
      return this.getConfig().closeIcon
   }

   /**
    * Retorna o título atual
    * @returns {string} O título atual
    */
   getTitle() {
      return this.getConfig().title
   }

   /**
    * Retorna a descrição atual
    * @returns {string} A descrição atual
    */
   getDescription() {
      return this.getConfig().desc
   }

   /**
    * Retorna o ZIndex a ser utilizado pela aba
    * @returns {number} O número
    */
   getZIndex() {
      return Number(this.getConfig().zIndex)
   }

   /**
    * Retorna o nome da animação que deve ser usada
    * @returns {string} O nome
    */
   getAnimationName() {
      return 'SP__' + this.getConfig().openAnimation
   }

   /**
    * Retorna a configuração do Loader
    * @returns {object} A configuração do loader
    */
   getLoaderConfig() {
      return this.getConfig().loader
   }

   /**
    * Retorna se deve ser destruido
    * @returns {boolean} Se deve ser destruido 
    */
   shouldRemove() {
      return this.isClosed() && this.shouldDestroy()
   }

   /**
    * Retorna se deve destruir a aba após fechar
    * @returns {boolean} Se deve ser destruído
    */
   shouldDestroy() {
      return this.getConfig().destroy
   }

   /**
    * Adiciona a página ao documento ou elemento que foi passado pela vonfig
    */
   append() {
      this.hasTarget()
         ? this.getTarget().append(...this.getView())
         : this.getSubstituteTarget().append(...this.getView())
   }

   /**
    * Retorna o elemento que deve ser o pai desta aba
    * @returns {JQuery<HTMLElement>} O elemento pai
    */
   getTarget() {
      return this.getConfig().target
   }

   /**
    * Retorna se tem um target
    * @returns {boolean} Se tem um target
    */
   hasTarget(){
      return !!this.getTarget() && !!this.getTarget().length
   }

   /**
    * Retorana o target substituto
    * @returns {JQuery<HTMLElement | null>} O elemento substituto
    */
   getSubstituteTarget() {
      return $(document.body).children('.SP__page')
   }

   /**
    * Retorna a visualização da aba
    * @returns {JQuery<HTMLElement>[]} Os elementos pertencentes a esta aba
    */
   getView() {
      return [
         this.getTab(),
         this.getOverlay()
      ]
   }

   /**
    * Retorna o elemento da aba
    * @returns {JQuery<HTMLElement>} O elemento da aba
    */
   getTab() {
      return this.tab
   }

   /**
    * Retorna o elemento do fundo
    * @returns {JQuery<HTMLElement>} O overlay
    */
   getOverlay() {
      return this.overlay
   }

   /**
    * Altera o estado da aba
    */
   toggle() {
      this.isOpen()
         ? this.close()
         : this.open()
   }

   /**
    * Abre a aba
    */
   open() {
      this.getConfig().open = true
      this.getConfig().onOpen(this)

      setTimeout(() => {
         this.tab.addClass('isShown')
         this.overlay.addClass('isShown')
      })
   }

   /**
    * Fecha a aba
    */
   close() {
      this.getConfig().open = false
      this.getConfig().onClose(this)

      this.tab.removeClass('isShown')
      this.overlay.removeClass('isShown')
   }

   /**
    * Retorna se a aba está aberta
    * @returns {boolean} Se está aberta
    */
   isOpen() {
      return this.getConfig().open
   }

   /**
    * Retorna se a aba está fechada
    * @returns {boolean} Se está fechada
    */
   isClosed() {
      return !this.isOpen()
   }

   /**
    * Mostra o loader
    */
   showLoader() {
      this.content.empty()
      this.content.append(this.loader.getView())
   }

   /**
    * Remove o loader do container
    */
   hideLoader() {
      this.loader.getView().remove()
   }

   /**
    * Remove os elementos da página
    */
   removeFromPage() {
      this.getView().forEach(element => element.remove())
   }

   /**
    * Adiciona elementos no header
    * @param  {...JQuery[]} elements Os elementos
    */
   appendToHeader(...elements) {
      this.header.append(...elements)
   }

   /**
    * Adiciona elementos no header
    * @param  {...JQuery[]} elements Os elementos
    */
   prependToHeader(...elements) {
      this.header.prepend(...elements)
   }

   /**
    * Adiciona elementos no parte de informações
    * @param  {...JQuery[]} elements Os elementos
    */
   appendToInfo(...elements) {
      this.info.append(...elements)
   }

   /**
    * Pré-adiciona elementos no parte de informações
    * @param  {...JQuery[]} elements Os elementos
    */
   preppendToInfo(...elements) {
      this.info.prepend(...elements)
   }

   /**
    * Adiciona elementos no parte de opções
    * @param  {...JQuery[]} elements Os elementos
    */
   appendToOptions(...elements) {
      this.options.append(...elements)
   }

   /**
    * Pré-adiciona elementos no parte de opçções
    * @param  {...JQuery[]} elements Os elementos
    */
   prependToOptions(...elements) {
      this.options.prepend(...elements)
   }

   /**
    * Adiciona elementos no conteúdo
    * @param  {...JQuery[]} elements Os elementos
    */
   appendToContent(...elements) {
      this.hideLoader()
      this.content.append(...elements)
   }

   /**
    * Pré-adiciona elementos no conteúdo
    * @param  {...JQuery[]} elements Os elementos
    */
   prependToContent(...elements) {
      this.hideLoader()
      this.content.prepend(...elements)
   }

   /**
    * Adiciona elementos no rodapé
    * @param  {...JQuery[]} elements Os elementos
    */
   appendToFooter(...elements) {
      this.footer.append(...elements)
   }

   /**
    * Pré-adiciona elementos no footer
    * @param  {...JQuery[]} elements Os elementos
    */
   prependToFooter(...elements) {
      this.footer.prepend(...elements)
   }
}