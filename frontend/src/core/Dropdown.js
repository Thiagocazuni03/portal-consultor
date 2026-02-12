import { Div, Icon, P } from '../utils/Prototypes.js'
import $ from 'jquery'
 
export default class Dropdown{
   constructor(config){
      
      this.config = $.extend(true, {

         css: '',
         title: 'Sem título',
         icon: 'ic-down',
         gap: '0px',
         open: false,
         appendToContent: [],
         appendToOptions: [],
         appendToFooter: [],
         disabled: false,
         titleSize: 20,
         onToggle: () => {}

      }, config)

      //Elementos
      this.dropdown = new Div('SP__dropdown')
      this.header = new Div('SP__dropdown__header')
      this.options = new Div('SP__dropdown__header__options')
      this.content = new Div('SP__dropdown__content')
      this.title = new P('SP__dropdown__header__title')
      this.icon = new Icon('SP__dropdown__header__options__icon')
      this.footer = new Div('SP__dropdown__footer')
      this.isOpen = this.config.open

      //Configurando
      this.title.append(this.config.title)
      this.icon.addClass(this.config.icon)
      this.dropdown.addClass(this.config.css)
      this.title.css('font-size', this.config.titleSize + 'px')

      //Montando
      this.dropdown.append(this.header, this.content, this.footer)
      this.options.append(this.icon)
      this.header.append(this.title, this.options)
      this.content.append(...this.config.appendToContent)
      this.options.append(...this.config.appendToOptions)
      this.footer.append(...this.config.appendToFooter)

      //Estilização
      this.content.css('overflow-y', this.isOpen ? 'visible' : 'hidden')
      this.header.css('margin-bottom', this.config.gap)
      this.content.on('transitionend', () => this.isOpen && this.content.css('overflow-y', 'visible'))
      this.content.on('transitionstart', () => !this.isOpen && this.content.css('overflow-y', 'hidden'))

      //Teste
      if(!this.isOpen){
         this.close()
      }

      //Eventos
      this.header.click(() => {
         if(this.config.disabled) return
         this.toggle()
      })
   }

   toggle(){
      this.isOpen ? this.close() : this.open()
      this.config.onToggle()
   }

   update(){
      this.isOpen
         ? this.open()
         : this.close()
   }

   close(){
      this.isOpen = false
      this.dropdown.removeClass('isOpen')
      this.content.css('max-height', 0)
   }

   open(){
      this.isOpen = true
      this.dropdown.addClass('isOpen')
      this.content.css('max-height', this.getContentHeight() + 'px')
   }

   getContentHeight(){
      const allChildren = Array.from(this.content.children())
      const totalHeight = allChildren.reduce((total, child) => total + $(child).outerHeight(true), 0)

      return totalHeight
   }

   appendToContent(...items){
      this.content.append(...items)
   }

   getView(){
      return this.dropdown 
   }
}