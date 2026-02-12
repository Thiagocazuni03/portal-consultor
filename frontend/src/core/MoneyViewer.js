import { CURRENCY } from '../api/Variables.js'
import { Div, P } from '../utils/Prototypes.js'
import $ from 'jquery'

export default class MoneyViewer{
   constructor({
      value = 0,
      description,
      hideCents = false,
      tooltip,
      onClick = () => {},
      cursor,
      css,
      color
   }){

      this.wrapper = new Div('SP__money')
      this.description = new P('SP__money__description')
      this.currency = new P('SP__money__currency')
      this.integer = new P('SP__money__integer')
      this.decimals = new P('SP__money__decimal')
      this.onClick = onClick 

      this.wrapper.css('cursor', cursor)
      this.currency.text(CURRENCY)
      this.wrapper.click(() => this.onClick())

      if(tooltip){
         this.wrapper.attr('data-tooltip', tooltip)
      }
      if(css){
         this.wrapper.addClass(css)
      }
      if(color){
         this.currency.css('color', color)
         this.integer.css('color', color)
         this.decimals.css('color', color)
      }
      if(hideCents){
         this.decimals.css('display', 'none')
      }
      if(description){
         this.wrapper.append(this.description)
      }

      this.wrapper.append(
         this.currency,
         this.integer,
         this.decimals
      )

      this.updateValue(value)
      this.updateDesc(description)
   }

   updateDesc(text){
      this.description.text(text)
   }

   updateValue(value){
      const valueSplit = String(parseFloat(value)).split('.')
      const integerValue = (valueSplit[0] ?? '0')
      const decimalsValue = ',' + (valueSplit[1] ?? '00').padEnd(2, '0')

      this.integer.text(integerValue)
      this.decimals.text(decimalsValue)
   }

   getView(){
      return this.wrapper
   }
}