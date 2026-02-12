import { AssemblyCoordinator } from './AssemblyCoordinator.js'
import DataCart from './DataCart.js'
import { ResourcesMapper } from './resources/ResourcesMapper.js'
import { ResourcesService } from './resources/ResourcesService.js'

export default class RelatedProductsOfferHandler{

   static #dataCart
   static #resources

   static handle({
      dataCart,
      resources
   }){
      this.#dataCart = dataCart
      this.#resources = resources

      const coordinator = new AssemblyCoordinator(resources, dataCart)
      const 

   }

}