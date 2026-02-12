import { Div, P } from '../utils/Prototypes.js'
import $ from 'jquery'

export default class Tooltip{
   constructor(config){
      
      //Configuração padrão
      this.config = $.extend(true, {

         on: null,
         css: '',
         position: 'bottom',
         background: 'var(--fifth)',
         color: 'white',
         padding: '0.5rem',
         header: [],
         nowrap: true,
         content: [],
         footer: [],
         parentPos: 'relative',
         maxWidth: '300px',
         style: {}

      }, config)

      //Elementos
      this.tooltip = new Div('SP__tooltip')
      this.header = new Div('SP__tooltip__header')
      this.content = new Div('SP__tooltip__content')
      this.footer = new Div('SP__tooltip__footer')

      //Configurações
      this.tooltip.css(this.config.style)
      this.tooltip.addClass(this.config.position)
      this.tooltip.css('background-color', this.config.background)
      this.tooltip.css('color', this.config.color)
      this.tooltip.css('padding', this.config.padding)
      this.tooltip.css('max-width', this.config.maxWidth)
      this.tooltip.css('white-space', this.config.nowrap ? 'nowrap' : 'normal')
      this.tooltip.addClass(this.config.css)

      //Interior
      this.header.append(this.config.header)
      this.content.append(this.config.content)
      this.footer.append(this.config.footer)

      //Montando
      this.tooltip.append(
         this.header,
         this.content,
         this.footer
      )

      this.setup()
   }

   /**
    * Se coloca no elemento que deve ficar, cria escutadores de evento
    */
   setup(){
      if(!this.config.on) return
      
      if(this.config.parentPos) this.config.on.css('position', this.config.parentPos)

      this.config.on.on('mouseenter', () => this.tooltip.addClass('isShown'))
      this.config.on.on('mouseleave', () => this.tooltip.removeClass('isShown'))
      this.config.on.append(this.tooltip)
   }

   /**
    * Retorna o node da tooltip 
    */
   getView(){
      return this.tooltip
   }

   static text(text){
      return new P('SP__tooltip__text').append(text)
   }

   static title(text){
      return new P('SP__tooltip__title').append(text)
   }

   static dot(text){
      return new P('SP__tooltip__dot').append(text)
   }

   static badge(text){
      return new P('SP__tooltip__badge').append(text)
   }
}