import Tab from '../../components/Tab.js'
import UserStorage from '../../core/UserStorage.js'
import { Div, P } from '../../utils/Prototypes.js'
import { TERMS } from '../../api/Variables.js'

export default class TermsTab extends Tab {
   constructor(config) {
      super({ ...config, hasFooter: false })

      //Texto base
      this.title.text('Termos de Uso')
      this.desc.text('Os termos de uso em relacionados a utilização do portal')

      //Criando elementos
      this.termsDiv = new Div('SP__terms')

      //Configurando
      this.leftButton.remove()
      this.rightButton.remove()

      //Inicializando
      this.createAndAppendUserTerms()
      this.appendToContent(this.termsDiv)
   }

   async createAndAppendUserTerms() {
      const termsDate = new P('SP__terms__date')
      const termsMessage = new P('SP__terms__text')

      const termsSignedDate = await UserStorage.getSellerInfo('terms')
      const signedDate = termsSignedDate.split(' ')[0].replace(/-/gi, '/')
      const signedTime = termsSignedDate.split(' ')[1]

      termsDate.text(`Você assinou os termos de utilização do Portal na data ${signedDate} ás ${signedTime}.`)
      termsMessage[0].innerText = TERMS.trim()

      this.termsDiv.append(termsDate, termsMessage)
   }
}
