import Modal from '../../core/Modal.js'

export default class LoadingModal extends Modal{
   constructor(config){
      super({
         canBeClosed: false,
         icon: 'ic-gear',
         color: 'var(--orange)',
         title: 'Aguarde',
         message: 'Aguarde um momento.',
         hasFooter: false,
         css: 'hasNoFooter',
         animation: 'rotate',
         zIndex: 20,
         ...config
      })
   }
}