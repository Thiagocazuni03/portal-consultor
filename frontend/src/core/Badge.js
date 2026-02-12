import { Div, Icon, P } from '../utils/Prototypes.js'
import $ from 'jquery'

export default class Badge{
   constructor(config){

      this.config = $.extend({

         style: {},
         prepend: false,
         parentPos: 'relative',
         static: false,
         hasIcon: true,
         title: '',
         round: true,
         fontSize: 16,
         icon: 'ic-check',
         color: 'var(--green)',
         textColor: 'white',
         left: 100,
         boldIcon: false,
         top: 0,
         padding: '0.35rem',
         tooltip: '',
         transform: ['-50%', '-50%'],
         invert: false,
         size: 25,
         border: 'transparent',
         on: null,
         cursor: 'default',
         onClick: () => {}

      }, config)

      this.badge = new Div('SP__badge')
      this.icon = new Icon('SP__badge__icon')
      this.title = new P('SP__badge__title')

      this.icon.addClass(this.config.icon)
      this.title.text(this.config.title)
      this.badge.css('background-color', this.config.color)
      this.badge.css('border-radius', this.config.round ? '50%' : '4px')
      this.badge.css('transform', `translate(${this.config.transform.join(',')})`)
      this.badge.css('left', this.config.left + '%')
      this.badge.css('top', this.config.top + '%')
      this.icon.css('width', this.config.fontSize)
      this.icon.css('height', this.config.fontSize)
      this.title.css('font-size', this.config.fontSize - 3)
      this.badge.css('color', this.config.textColor)
      this.badge.css('cursor', this.config.cursor)
      this.badge.css('padding', this.config.padding)
      this.badge.css('border-color', this.config.border)
      this.badge.css(this.config.style)

      //Clique
      this.badge.click((event) => {
         event.stopPropagation()
         this.config.onClick()
      })

      if(!this.config.title){
         this.badge.css('width', this.config.size + 'px')
         this.badge.css('height', this.config.size + 'px')
      }
      if(this.config.boldIcon){
         this.icon.css('font-weight', '700')
      }
      if(this.config.static){
         this.badge.css('position', 'static')
      }
      if(this.config.invert){
         this.badge.addClass('isReverse')
      }
      if(this.config.hasIcon){
         this.badge.append(this.icon)
      }
      if(this.config.title){
         this.badge.append(this.title)
      }
      if(this.config.tooltip){
         this.badge.attr('title', this.config.tooltip)
      }
      if(this.config.on){
         $(this.config.on)[this.config.prepend ? 'prepend' : 'append'](this.badge)
      }
      if(this.config.parentPos && !this.config.static){
         $(this.config.on).css('position', this.config.parentPos)
      }
   }

   setTitle(title){
      this.title.text(title)
   }

   getView(){
      return this.badge
   }
}