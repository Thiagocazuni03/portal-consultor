import Modal from '../../core/Modal.js'
import UserStorage from '../../core/UserStorage.js'

export default class LogoutModal extends Modal {
   constructor() {
      super({
         icon: 'ic-exit',
         title: 'Deseja sair?',
         color: 'var(--orange)',
         message: 'Sua sessão será __finalizada__.',
         buttons: [{ 
            type: 'blank',
            text: 'Cancelar'
         }, {
            type: 'filled',
            color: 'var(--orange)',
            text: 'Sair',
            onClick: () => UserStorage.logoutSession(),
         }]
      })
   }
}