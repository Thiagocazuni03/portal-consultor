import { STORAGE_URL } from '../api/Variables.js'
import { Div, Img } from '../utils/Prototypes.js'

/**
 * Classe responsável por ser a visualização de ofertagem de um produto
 */
export class ProductOfferItem {

   #product
   #onClick

   /**
    * Instância a classe
    * @param {object} product O produto 
    */
   constructor(product) {
      this.#product = product
      this.#onClick = () => { }

      //Elementos
      this.container = Div('SP__offer')
      this.image = Img('SP__offer__image')
      this.info = Div('SP__offer__info')
      this.title = Div('SP__offer__info__title')
      this.description = Div('SP__offer__info__description')

      //Configurando
      this.image.attr('src', STORAGE_URL + this.#product.image)
      this.title.text(this.#product.title)
      this.description.text('Clique para adicionar')

      //Evento
      this.container.on('click', () => {
         if (this.#onClick) {
            this.#onClick()
         }
      })

      //Montando
      this.container.append(
         this.image,
         this.info,
         this.arrow
      )

      this.info.append(
         this.title,
         this.description
      )
   }

   /**
    * Adiciona um escutador de evento a oferta
    * @param {() => unknown} handler O escutador de evento 
    */
   setOnClick(handler){
      this.#onClick = handler
   }

   /**
    * Retorna a visualização do item
    * @returns {Jquery<HTMLElement>} O elemento
    */
   getView() {
      return this.container
   }
}