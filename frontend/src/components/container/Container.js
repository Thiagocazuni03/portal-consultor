import Component from '../Component.js'
import { Div } from '../../utils/Prototypes.js'

export default class Container extends Component{
   constructor(config){
      super(config)

      //Configuração
      this.config = $.extend({
         
         top: null,
         left: null,
         bottom: null,
         right: null,
         absolute: false,
         radius: '6px',
         bordered: true,
         padding: '0.75rem',
         background: 'var(--secondary)',
         display: 'flex',
         direction: 'column',
         columns: null,
         scrollable: false,
         borderWidth: '1px',
         borderColor: 'var(--fourth)',
         shadow: false,
         gap: 0,

      }, config)

      //Elementos
      this.container = new Div('container')
      
      return this.container
   }
}