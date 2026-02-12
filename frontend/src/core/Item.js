import { Div, Icon, P } from '../utils/Prototypes.js'
import Utils from './Utils.js'
import $ from 'jquery'

export default class Item {
   constructor(config) {

      this.config = $.extend(true, {

         onClick: () => {},
         item: [],
         main: [],
         footer: [],
         left: [],
         center: [],
         right: [],
         columns: [],
         style: {},
         cursor: 'default',
         css: ''

      }, config)

      //Elementos de layout
      this.item = new Div('SP__item')
      this.header = new Div('SP__item__header')
      this.main = new Div('SP__item__main')
      this.footer = new Div('SP__item__footer')
      this.left = new Div('SP__item__main__left')
      this.center = new Div('SP__item__main__center')
      this.right = new Div('SP__item__main__right')

      //Montando
      this.item.append(this.header, this.main, this.footer)
      this.main.append(this.left, this.center, this.right)
      
      //Colunas
      if(this.config.columns){
         this.main.css('grid-template-columns', this.config.columns.join(' '))
      }
      if(this.config.cursor){
         this.item.css('cursor', this.config.cursor)
      }

      if(this.config.css){
         this.item.addClass(this.config.css)
      }

      //Estilo
      this.item.css(this.config.style.item ?? {})
      this.main.css(this.config.style.main ?? {})
      this.footer.css(this.config.style.footer ?? {})
      this.left.css(this.config.style.left ?? {})
      this.center.css(this.config.style.center ?? {})
      this.right.css(this.config.style.right ?? {})
      this.header.css(this.config.style.header ?? {})

      //Adicionando elementos
      this.item.append(this.config.item)
      this.header.append(this.config.header)
      this.main.append(this.config.main)
      this.footer.append(this.config.footer)
      this.left.append(this.config.left)
      this.center.append(this.config.center)
      this.right.append(this.config.right)

      //Eventos
      this.item.click((event) => this.config.onClick(event, this))
      
      if(this.config.view) return this.item
   }

   /**
    * Retorna o node do item 
    */
   getView() {
      return this.item
   }
   
   static row(...items) {
      return new Div('SP__item__row')
         .append(...items)
   }

   static title(title) {
      return new P('SP__item__title')
         .append(title)
   }

   static desc(desc) {
      return new P('SP__item__desc')
         .append(desc)
   }

   static brand(brand){
      return new Div('SP__item__brand')
         .append(brand)
   }

   static tag(text, background, color) {
      return new Div('SP__item__tag')
         .append(text)
         .css('background-color', background)
         .css('color', color)
   }

   static icon(icon) {
      return new Icon('SP__item__icon')
         .addClass(icon)
   }

   static space(size){
      return new Div('SP__item__space')
         .css('height', size * 4 + 'px')
   }

   static checkbox(initial){
      return new Div('SP__item__checkbox')
         .append(new Icon('ic-check'))
         .addClass(initial ? 'isActive' : '')
         .click(function(){ $(this).toggleClass('isActive') })
   }

   static image(url){
      const image = new Div('SP__item__image')

      image.addClass('isLoading')

      Utils.tryToLoadImage(url)
         .then(() => image.css('background-image', `url(${url})`).addClass('isLoaded'))
         .catch(() => image.addClass('hasError'))
         .finally(() => image.removeClass('isLoading'))

      return image
   }
}