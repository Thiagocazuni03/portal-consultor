import { Div, Icon, P } from '../utils/Prototypes.js'
import $ from 'jquery'

export default class PopUp{

   static openPopUps = {}

   constructor({
      appendTo = $('body'),
      icon = 'ic-info-circle',
      timeOnScreen = 2600,
      message = 'Pop Up sem mensagem',
      color = 'var(--fifth)',
      fontSize = 16,
      zIndex = 17,
      uniqueToken
   }){
      this.destroyPopUpIfOpen(uniqueToken)
      
      //Dados
      this.uniqueToken = uniqueToken
      this.timeOnScreen = timeOnScreen
      this.appendTo = (appendTo ?? $('body'))

      //Criando elementos
      this.wrapper = new Div('SP__popup')
      this.icon = new Icon('SP__popup__icon')
      this.message = new P('SP__popup__message')

      //Configurando
      this.message.text(message)
      this.icon.addClass(icon)
      this.message.css('font-size', fontSize + 'px')
      this.icon.css('font-size', fontSize + 10 + 'px')
      this.wrapper.css('z-index', zIndex)
      this.wrapper.attr('active', false)
      this.wrapper.css('--bg-color', color)

      //Eventos/Montando
      this.wrapper.on('click', () => this.goAway())
      this.wrapper.append(this.icon, this.message)
   }

   trigger(){
      this.appendTo.append(this.wrapper)
      setTimeout(() => this.wrapper.attr('active', true), 50)
      setTimeout(() => this.goAway(), this.timeOnScreen)
      PopUp.openPopUps[this.uniqueToken] = true
   }

   goAway(){
      this.wrapper.attr('active', false)
      setTimeout(() => this.wrapper.remove(), 300)
      PopUp.openPopUps[this.uniqueToken] = false
   }

   destroyPopUpIfOpen(uniqueToken){
      if(!uniqueToken) return
      if(!PopUp.openPopUps[uniqueToken]) return

      throw 'PopUp já aberto'
   }

   static trigger(icon, color, message, appendTo){
      new PopUp({
         icon,
         color,
         message,
         appendTo
      }).trigger()
   }

   static triggerFail(message, appendTo, uniqueToken){
      new PopUp({
         icon: 'ic-close',
         color: 'var(--red)',
         message: message,
         appendTo: appendTo,
         uniqueToken: uniqueToken
      }).trigger()
   }
   
   static triggerSuccess(message, appendTo, uniqueToken){
      new PopUp({
         icon: 'ic-check',
         color: 'var(--green)',
         message: message,
         appendTo: appendTo,
         uniqueToken: uniqueToken
      }).trigger()
   }

   static triggerInfo(message, appendTo, uniqueToken){
      new PopUp({
         icon: 'ic-info-circle',
         color: 'var(--fifth)',
         message: message,
         appendTo: appendTo,
         uniqueToken: uniqueToken
      }).trigger()
   }

   static triggerCopy(message, appendTo, uniqueToken){
      new PopUp({
         icon: 'ic-editor-copy',
         color: 'var(--orange)',
         message: message,
         appendTo: appendTo,
         uniqueToken: uniqueToken
      }).trigger()
   }
}