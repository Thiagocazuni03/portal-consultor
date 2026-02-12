import { Icon, Label } from '../utils/Prototypes.js'
import Component from './Component.js'
import $ from 'jquery'

export default class Checkbox extends Component {

   static instances = []

   constructor(config) {
      super()

      //Configuração
      this.config = $.extend(true, {

         radioKey: null,
         type: 'checkbox',
         icon: 'ic-check',
         background: 'var(--third)',
         color: 'var(--green)',
         active: false,
         size: 24,
         propagate: true,
         onToggle: () => { },
         onActive: () => { },
         onUnactive: () => { }

      }, config)

      //Elementos
      this.container = new Label('checkbox')
      this.icon = new Icon('checkbox__icon')

      //Configurando
      this.icon.addClass(this.getConfig().icon)
      this.container.css('--active-color', this.getConfig().color)
      this.container.css('background-color', this.getConfig().background)
      this.container.css('height', this.getConfig().size + 'px')
      this.container.css('width', this.getConfig().size + 'px')

      //Eventos
      this.container.click((event) => {
         if(!this.config.propagate){
            event.stopPropagation()
         }
         this.toggle(event)
      })

      //Caso ativa
      if(this.isActive()){
         this.getView().addClass('isActive')
      }

      //Montando
      this.container.append(this.icon)

      //Registrando instância
      Checkbox.instances.push(this)
   }

   /**
    * Alterna o estado de ativo
    */
   toggle() {
      if (this.isActive()) {

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
   activate() {
      if(this.isRadio()) {
         this.deactivateRadioSiblings()
      }
         
      this.getConfig().active = true
      this.getView().addClass('isActive')
   }

   /**
    * Desativa o toggle
    */
   deactivate() {
      this.getConfig().active = false
      this.getView().removeClass('isActive')
   }

   /**
    * Desativa as irmãs
    */
   deactivateRadioSiblings(){
      Checkbox.instances
         .filter(instance => instance !== this)
         .filter(instance => instance.getRadioKey() === this.getRadioKey())
         .forEach(instance => instance.deactivate())
   }

   /**
    * Retorna a chave radio
    * @returns {string | null} A chave 
    */
   getRadioKey(){
      return this.getConfig().radioKey
   }

   /**
    * Retorna se é uma checkbox estilo radio
    * @returns {boolean} Se é estilo radio
    */
   isRadio(){
      return Boolean(this.getRadioKey())
   }

   /**
    * Retorna se está ligado o toggle
    * @returns {boolean} Se está ativo o toggle
    */
   isActive() {
      return this.getConfig().active
   }
}