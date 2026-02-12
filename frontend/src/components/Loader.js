import { Div, Ul, P, Li } from '../utils/Prototypes.js'
import Component from './Component.js'
import $ from 'jquery'

export default class Loader extends Component {
   constructor(config) {
      super(config)

      //Configurção
      this.config = $.extend(true, {

         type: 'loader',
         size: 6,
         interval: 50,
         dots: 7,
         title: 'Carregando'

      }, config)

      //Elementos
      this.container = new Div('loader')
      this.loader = new Ul('loader__dots')
      this.title = new P('loader__title')
      this.message = new P('loader__message')

      //Configurando
      this.title.text(this.getTitle())
      this.message.text(this.getMessage())

      //Montando
      this.container.append(
         this.loader,
         this.title,
         this.message
      )

      //Adicionando pontos
      this.loader.append(
         ...this.getDots()
      )
   }

   /**
    * Cria e retorna os pontos do laoder
    * @returns {JQuery<HTMLLIElement>[]} Todos os pontos
    */
   getDots(){
      return [...Array(this.getDotsAmount())].map((_, index) => this.createDot(index))
   }

   /**
    * Cria um ponto para ser usado no Loader
    * @param {number} index O índice do ponto
    */
   createDot(index){
      const dot = new Li('loader__dots__dot')
      const delay = index * 100 * -1

      dot.css('animation-delay', delay + 'ms')
      dot.css('width', this.getDotsSize() + 'px')
      dot.css('height', this.getDotsSize() + 'px')

      return dot
   }

   /**
    * Retorna o títlo do Loader
    * @returns {string} O título do
    */
   getTitle() {
      return this.getConfig().title
   }

   /**
    * Retorna a mensagem do Loader
    * @returns {string} A mensagem do Loader
    */
   getMessage() {
      return this.getConfig().message
   }

   /**
    * Retorna o tempo de intervalo entre cada ponto
    * @returns {number} O tempo em milisegundos
    */
   getInterval(){
      return this.getConfig().interval
   }

   /**
    * Retorna a quantidade de pontos no loader
    * @returns {number} A quantidade de pontos no loader
    */
   getDotsAmount(){
      return this.getConfig().dots
   }

   /**
    * Retorna o tamanho de cada ponto
    * @returns {number} O tamanho em pixels de cada ponto
    */
   getDotsSize(){
      return this.getConfig().size
   }
}