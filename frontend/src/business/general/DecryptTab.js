import InputForm from '../../core/InputForm.js'
import Tab from '../../components/Tab.js'
import PopUp from '../../core/PopUp.js'
import UserStorage from '../../core/UserStorage.js'

export default class DecryptTab extends Tab{
   constructor(config){
      super({
         title: 'Descriptografar',
         desc: 'Informe uma senha e o conteúdo crriptografado.',
         leftButtonText: 'Voltar',
         rightButtonText: 'Descriptografar',
         onRightButtonClick: () => this.tryToDecrypt(),
         ...config
      })

      //Formulário
      this.descryptForm = new InputForm({
         showRequired: false,
         inputs: [
            {
               label: 'Senha',
               key: 'password',
               type: 'password',
               placeholder: 'Digite a senha aqui...',
               invalid: 'O campo não pode estar vazio',
               required: true,
               value: ''
            },
            {
               label: 'Conteúdo',
               key: 'content',
               type: 'text',
               textarea: true,
               required: true,
               placeholder: 'Cole o conteúdo aqui...',
               invalid: 'O campo não pode estar vazio',
               value: ''
            },
            {
               label: 'Tipo',
               key: 'type',
               type: 'select',
               options: [
                  { value: 'JSON', text: 'JSON' },
                  { value: 'TEXT', text: 'Texto' },
               ]
            }
         ]
      })

      this.appendToContent(this.descryptForm.getView())
   }

   async tryToDecrypt(){
      const necessaryFields = ['password', 'content']
      const emptyFields = necessaryFields.filter((field) => this.descryptForm.getValues()[field].trim() === '')

      if(emptyFields.length > 0){
         this.descryptForm.triggerInvalidInputs({ invalid: emptyFields })
         return
      }
      
      try{
         const formValues = this.descryptForm.getValues()
         const decryptedText = await UserStorage.aesCGMDecrypt(formValues.content.trim(), formValues.password)

         await navigator.clipboard.writeText(decryptedText)

         if(formValues.type === 'JSON'){
            console.log(JSON.parse(decryptedText))
         }
         if(formValues.type === 'TEXT'){
            console.log(decryptedText)
         }

         PopUp.triggerCopy('Conteúdo descriptografado copiada para a área de transferência.')

      } catch(error){

         console.error(error)
         PopUp.triggerFail('Não foi possível descriptografar este conteúdo.', this.tab, 'DECRYPT_FAIL')

      }
   }
}