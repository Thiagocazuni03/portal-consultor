import { Div, Icon, Input } from '../utils/Prototypes.js'
import $ from 'jquery'

export default class PlusMinus {
   constructor(config) {

      this.config = $.extend({

         css: '',
         max: Number.POSITIVE_INFINITY,
         min: Number.NEGATIVE_INFINITY,
         value: '',
         onChange: () => {}

      }, config ?? {})

      //Elementos
      this.wrapper = new Div('SP__plusminus')
      this.plus = new Icon('SP__plusminus__minus')
      this.minus = new Icon('SP__plusminus__plus')
      this.input = new Input('SP__plusminus__text')

      //Configurando
      this.wrapper.addClass(this.config.css)
      this.input.val(this.config.value)
      this.input.attr('type', 'text')
      this.plus.addClass('ic-add')
      this.minus.addClass('ic-minus')
      this.input.on('input', (event) => this.handleInputChange(event))
      this.plus.click((event) => this.handlePlusClick(event))
      this.minus.click((event) => this.handleMinusClick(event))

      //Montando
      this.wrapper.append(this.minus, this.input, this.plus)
   }

   handleInputChange(event) {
      const targetText = String(event.target.value)
      const noCharsText = targetText.replace(/\D/gi, '')
      const textAsNumber = noCharsText ? Number(noCharsText) : NaN


      if(Number.isNaN(textAsNumber)){

         this.config.value = ''

      } else if(textAsNumber >= this.config.max){

         this.config.value = this.config.max

      } else if(textAsNumber <= this.config.min){

         this.config.value = this.config.min

      } else {
      
         this.config.value = textAsNumber

      }

      event.target.value = this.config.value
      this.config.onChange(this.config.value)
   }

   handlePlusClick(){
      const newValue = (this.config.value || 0) + 1

      if(Number.isNaN(newValue)) return
      if(newValue > this.config.max) return

      this.config.value = newValue
      this.input.val(this.config.value)

      this.config.onChange(this.config.value)

   }

   handleMinusClick(){
      const newValue = (this.config.value || 0) - 1

      if(Number.isNaN(newValue)) return
      if(newValue < this.config.min) return

      this.config.value = newValue
      this.input.val(this.config.value)

      this.config.onChange(this.config.value)
   }
   
   getValue(){
      return this.config.value 
   }

   getView(){
      return this.wrapper
   }

}