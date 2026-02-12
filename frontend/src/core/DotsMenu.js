import { Div, Icon, P } from "../utils/Prototypes.js"
import $ from 'jquery'

export default class DotsMenu {
   constructor(config) {

      this.config = $.extend({

         options: [],
         icon: 'ic-dots-v',
         closeOnOutClick: true,
         color: 'var(--primary)',
         iconSize: 24,
         iconsSize: 18,
         textSize: 16,
         isBold: false,
         zIndex: 5,
         menuIndex: 5,
         style: {}

      }, config ?? {})

      //Elementos
      this.toggle = new Div('SP__more')
      this.menu = new Div('SP__more__menu')

      //Estado
      this.isOpen = false
      
      //Configurando
      this.toggle.append(new Icon(this.config.icon + ' '  + 'SP__more__icon'))
      this.toggle.addClass(this.config.icon)
      this.toggle.css('width', this.config.iconSize + 'px')
      this.toggle.css('height', this.config.iconSize + 'px')
      this.toggle.css('color', this.config.color)
      this.toggle.css('font-weight', this.config.isBold ? '700' : '400')
      this.toggle.css('z-index', this.config.zIndex)
      this.menu.css('z-index', this.config.menuIndex)
      this.toggle.css(this.config.style)

      //Montando
      this.toggle.append(this.menu)
      this.toggle.click((event) => {
         event.stopPropagation()
         this.closeOtherMenus()
         this.toggleMenu()
      })

      //Inicializando
      this.initialize()
   }

   /**
    * Inicializa a aplicação
    */
   initialize(){
      this.setupOnOutClick()
      this.createAndSetOptions()
   }

   updateOptions(newOptions){
      this.config.options = newOptions;
      this.createAndSetOptions()
   }

   /**
    * Fecha os outros menus
    */
   closeOtherMenus(){
      $('.SP__more__menu').removeClass('isShown')
   }

   /**
    * Cria e adiciona as opções no menu
    */
   createAndSetOptions(){
      this.menu.empty()

      this.config.options.forEach(({ text, icon, color, onClick, isBold }) => {
         const option = new Div('SP__more__menu__option')
         const optionIcon = new Icon('SP__more__menu__option__icon')
         const optionText = new P('SP__more__menu__option__text')

         optionText.text(text)
         optionIcon.addClass(icon)
         option.click(() => onClick(this))
         setTimeout(() => optionText.add(optionIcon).css('color', (color ?? '')))
         optionText.css('font-size', (this.config.textSize ?? ''))
         optionIcon.css('font-size', (this.config.iconsSize ?? this.config.textSize ?? ''))
         optionText.add(optionIcon).css('font-weight', (isBold ? 700 : 400))

         if(icon){
            option.append(optionIcon)
         }
         if(text){
            option.append(optionText)
         }

         this.menu.append(option)
      })
   }

   /**
    * Adiciona o evento de clique fora que fecha o menu 
    */
   setupOnOutClick(){
      if(!this.config.closeOnOutClick) return

      window.addEventListener('click', ({ target }) => {
         const isTargetToggle = this.toggle[0] === target
         const isTargetInsideToggle = this.toggle[0].contains(target)

         if(isTargetToggle || isTargetInsideToggle) return

         this.closeMenu()
      })
   }

   /**
    * Altera o estado do menu
    */
   toggleMenu(){
      this.menu[this.isOpen ? 'removeClass' : 'addClass']('isShown')
      this.isOpen = !this.isOpen
   }

   /**
    * Abre o menu
    */
   openMenu(){
      this.isOpen = true
      this.menu.addClass('isShown')
   }

   /**
    * Fecha o menu
    */
   closeMenu(){
      this.isOpen = false
      this.menu.removeClass('isShown')
   }

   /**
    * Retorna o menu 
    */
   getView(){
      return this.toggle
   }
}