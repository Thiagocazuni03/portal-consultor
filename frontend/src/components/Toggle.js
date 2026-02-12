import { Div, Label } from '../utils/Prototypes.js'
import Component from './Component.js'
import $ from 'jquery'

export default class Toggle extends Component{
   constructor(config){
      super()

      //Configuração
      this.config = $.extend(true, {
         
         type: 'toggle',
         icon: null,
         background: 'var(--third)',
         color: 'var(--green)',
         active: false,
         onToggle: () => {},
         onActive: () => {},
         onUnactive: () => {}

      }, config)
      
      //Elementos
      this.container = new Label('toggle')
      this.handle = new Div('toggle__handle')
      this.icon = new Div('toggle__handle__icon')

      //Configurando
      this.container.css('--active-color', this.getConfig().color)
      this.container.css('background-color', this.getConfig().background)

      //Eventos
      this.container.click(() => this.toggle())

      //Montando
      this.container.append(this.handle)
      this.handle.append(this.icon)
   }

   /**
    * Alterna o estado de ativo
    */
   toggle(){
      if(this.isActive()){

         this.deactivate()
         this.getConfig().onUnactive(this)
         
      } else {
         
         this.activate()
         this.getConfig().onActive(this)

      }

      this.getConfig().onToggle(this)
   }

   /**
    * Ativa o toggle
    */
   activate(){
      this.getConfig().active = true
      this.getView().addClass('isActive')
   }

   /**
    * Desativa o toggle
    */
   deactivate(){
      this.getConfig().active = false
      this.getView().removeClass('isActive')
   }

   /**
    * Retorna se está ligado o toggle
    * @returns {boolean} Se está ativo o toggle
    */
   isActive(){
      return this.getConfig().active
   }
}