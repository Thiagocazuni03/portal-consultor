import Modal from '../../core/Modal.js'
import InputForm from '../../core/InputForm.js'

export default class ChangePassMoldal extends Modal {
   constructor(config) {
      super({
         ...config,
         hasIcon: false,
         title: 'Alteração de Senha',
         message: 'Digite seu e-mail de acesso para realizar a alteração de sua senha',
         buttons: [
            { type: 'blank', text: 'Cancelar' },
            { type: 'filled', text: 'Enviar', color: 'var(--primary)', onClick: () => this.changePassword() }
         ]
      })

      this.form = new InputForm({
         showRequired: false, inputs: [{
            key: 'pass',
            label: '',
            type: 'text',
            placeholder: 'Digite seu e-mail de acesso',
            css: {
               'text-align': 'center',
               'font-size': '18px'
            }
         }]
      })
      this.appendToContent(this.form.getView())
   }

   changePassword() {
      alert('Enviando email de confirmação')
   }
}