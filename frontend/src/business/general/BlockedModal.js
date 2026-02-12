import Modal from '../../core/Modal.js'
import UserStorage from '../../core/UserStorage.js'

export default class BlockedModal extends Modal {
   constructor(config) {
      super({
         icon: 'ic-info-circle',
         title: 'Seu usuário está __bloqueado__.',
         message: 'Acha que foi um engano? Entre em contato com o suporte.',
         color: 'var(--red)',
         css: 'isUserBlocked',
         canBeClosed: false,
         buttons: [
            { type: 'blank', closeOnClick: false, text: 'Suporte' },
            { type: 'filled', closeOnClick: false, text: 'Sair', color: 'var(--red)', onClick: () => UserStorage.logoutSession() },
         ],
         ...config
      })
   }
}