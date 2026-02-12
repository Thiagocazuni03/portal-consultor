import Renderer from '../../core/Renderer.js'

export default class SalesSheetOrderAdapter{
   
   #sheet
   #render
   
   /**
    * Instância um adaptador para ser usado
    * @param {Renderer} sheet O renderizador da tabela 
    * @param {*} render O renderizador de cards
    */
   constructor(sheet, render){
      this.#sheet = sheet
      this.#render = render
   }

   /**
    * Deleta um pedido da lista
    * @param {string} identifier O identificador do pedido 
    */
   delete(identifier){
      this.#sheet.deleteItem(identifier)
      this.#render.deleteItem(identifier)
   }

   /**
    * Edita um pedido da lista
    * @param {string} identifier O identificador do pedido 
    * @param {object} item O pedido alterado
    */
   edit(identifier, item){
      this.#sheet.editItem(identifier, item)
      this.#render.editItem(identifier, item)

   }
}