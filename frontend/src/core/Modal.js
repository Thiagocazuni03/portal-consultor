import { Button, Div, H4, Icon, Input, P } from '../utils/Prototypes.js'
import $ from 'jquery'

export default class Modal {

   static openModals = {}

   constructor(config) {

      this.config = {
         uniqueToken: null,
         canBeClosed: true,
         hasIcon: true,
         hasTitle: true,
         hasFooter: true,
         hasMessage: true,
         hasContent:true,
         zIndex: 15,
         css: 'center',
         shouldDetach: false,
         animation: 'none',
         color: 'var(--primary)',
         icon: 'ic-info-circle',
         title: 'Sem título',
         message: 'Sem mensagem',
         buttons: [],
         innerButtons: [],
         autoOpen: false,
         appendTo: $('body'),
         appendToContent: null,
         appendToFooter: null,
         onEnter: () => {},
         onEscape: () => {},
         onBackspace: () => {},
         onClose: () => {},
         onOpen: () => {}
      }

      config && $.extend(true, this.config, config)

      /* ---------- ELEMENTOS ---------- */
      this.modal = new Div('SP__modal')
      this.content = new Div('SP__modal__content')
      this.footer = new Div('SP__modal__footer')
      this.icon = new Icon('SP__modal__icon')
      this.title = new H4('SP__modal__title')
      this.message = new P('SP__modal__message')
      this.overlay = new Div('SP__overlay')
      this.hiddenInput = new Input()
      this.loader = this.createLoader()
      this.buttonsList = []

      /* ---------- CONFIG VISUAL ---------- */
      this.modal.addClass(this.config.css)
      this.overlay.addClass(this.config.css)
      this.overlay.attr('active', false)
      this.overlay.css('z-index', this.config.zIndex - 1)
      this.modal.css('z-index', this.config.zIndex)
      this.modal.attr('active', false)

      this.icon
         .addClass(`SP__animation__${this.config.animation}`)
         .addClass(this.config.icon)

      setTimeout(() => this.icon.css('color', this.config.color))

      this.title.append(this.processHighlight(this.config.title))
      this.message.append(this.processHighlight(this.config.message))

      this.hiddenInput.attr('type', 'text')

      this.overlay.on('click', (event) => {
         event.stopPropagation()
         this.config.canBeClosed && this.closeModal()
      })

      /* ---------- INIT ---------- */
      this.destroyModalIfOpen()
      this.createAndAppendButtons()
      this.assembleSelf()
      this.createAndAppendInnerButtons()
      this.addKeyupListeners()

      if (this.config.appendToFooter) {
         this.footer.append(this.config.appendToFooter)
      }

      if (this.config.appendToContent) {
         this.appendToContent(this.config.appendToContent)
      }

      if (this.config.autoOpen) {
         this.openModal()
      }
   }

   /* =========================================================
      EVENTOS DE TECLADO
   ========================================================= */

   addKeyupListeners() {
      $(document).on('keyup', ({ key }) => {
         if (!Modal.openModals[this.config.uniqueToken]) return

         if (key === 'Enter') this.config.onEnter(this)
         if (key === 'Escape') this.config.onEscape(this)
         if (key === 'Backspace') this.config.onBackspace(this)
      })
   }

   /* =========================================================
      TEXTO COM HIGHLIGHT
   ========================================================= */

   processHighlight(text, index = 0) {
      if (!text?.match('__')) return text

      const isEven = index % 2 === 0
      const replaced = text.replace(
         '__',
         isEven
            ? `<strong style="color:${this.config.color}">`
            : '</strong>'
      )

      return this.processHighlight(replaced, index + 1)
   }

   /* =========================================================
      CONTROLE DE MODAL ÚNICO
   ========================================================= */

   destroyModalIfOpen() {
      if (!this.config.uniqueToken) return
      if (!Modal.openModals[this.config.uniqueToken]) return

      throw `Modal já aberto. Token: ${this.config.uniqueToken}`
   }

   /* =========================================================
      LOADER
   ========================================================= */

   createLoader() {
      const DOTS_NUMBER = 7
      const loader = new Div('SP__loader')

      for (let i = 0; i < DOTS_NUMBER; i++) {
         const dot = new Div('SP__loader__dot')
         dot.css('animation-delay', `${-i * 100}ms`)
         loader.append(dot)
      }

      return loader
   }

   setLoader() {
      this.content.empty()
      this.content.append(this.loader)
   }

   hideLoader() {
      this.loader.remove()
   }

   /* =========================================================
      ESTRUTURA
   ========================================================= */

   assembleSelf() {
      this.modal.empty()

      this.config.hasIcon && this.modal.append(this.icon)
      this.config.hasTitle && this.modal.append(this.title)
      this.config.hasMessage && this.modal.append(this.message)

      this.config.hasContent && this.modal.append(this.content)

      this.config.hasFooter && this.modal.append(this.footer)
   }

   appendTo() {
      this.config.appendTo.append(this.modal)

      this.config.overlayAppendTo
         ? this.config.overlayAppendTo.append(this.overlay)
         : this.config.appendTo.append(this.overlay)
   }

   appendToContent(...items) {
      this.content.append(...items)
   }

   /* =========================================================
      BOTÕES DO FOOTER
   ========================================================= */

   createAndAppendButtons() {
      this.config.buttons.forEach(({
         type,
         text,
         color = 'var(--primary)',
         closeOnClick = true,
         id,
         icon,
         onClick = () => {}
      }) => {

         const button = new Button('SP__footer__button')
         button.text(text)

         button.on('click', () => {
            onClick(this)
            closeOnClick && this.closeModal()
         })

         if (type === 'blank') {
            button.addClass('isBlank').css('color', color)
         }

         if (type === 'filled') {
            button
               .addClass('isFilled')
               .append(icon ? new Icon(`SP__footer__button__icon ${icon}`) : null)
               .css('background-color', color)
         }

         if (type === 'outlined') {
            button
               .addClass('isOutlined')
               .append(new Icon(`SP__footer__button__icon ${icon}`))
               .css({ color, 'border-color': color })
         }

         id && button.attr('id', id)

         this.buttonsList.push(button)
         this.footer.append(button)
      })
   }

   /* =========================================================
      BOTÕES INTERNOS
   ========================================================= */

   createAndAppendInnerButtons() {
      this.config.innerButtons.forEach(({
         type,
         text,
         color = 'var(--primary)',
         icon = 'ic-next',
         onClick = () => {}
      }) => {

         const button = new Button('SP__modal__button')
         button.text(text)
         button.on('click', onClick)

         if (type === 'blank') {
            button.addClass('isBlank').css('color', color)
         }

         if (type === 'filled') {
            button
               .addClass('isFilled')
               .append(icon ? new Icon(`SP__modal__button__icon ${icon}`) : null)
               .css('background-color', color)
         }

         if (type === 'outlined') {
            button
               .addClass('isOutlined')
               .append(new Icon(`SP__modal__button__icon ${icon}`))
               .css({ color, 'border-color': color })
         }

         this.appendToContent(button)
      })
   }

   /* =========================================================
      ABRIR / FECHAR
   ========================================================= */

   openModal() {
      this.appendTo()

      setTimeout(() => {
         this.modal.addClass('isShown', true)
         this.overlay.addClass('isShown', true)
      }, 5)

      Modal.openModals[this.config.uniqueToken] = this
      this.buttonsList.at(-1)?.focus()
      this.config.onOpen(this)
   }

   closeModal() {
      const TIME = 350

      this.modal.removeClass('isShown', false)
      this.overlay.removeClass('isShown', false)

      setTimeout(() => this.removeFromParent(), TIME)

      Modal.openModals[this.config.uniqueToken] = false
      this.config.onClose(this)
   }

   removeFromParent() {
      if (this.config.shouldDetach) {
         this.modal.detach()
         this.overlay.detach()
      } else {
         this.modal.remove()
         this.overlay.remove()
      }
   }

   /* =========================================================
      API
   ========================================================= */

   getView() {
      return this.modal
   }
}
