import { Div, Label, Input, Button } from "../../../utils/Prototypes.js"
import Translator from '../../../translation/Translator.js'

export default class ResetPassword {

  constructor() {
    const content = this.buildContent()
    this.container = new Div('')
    this.card = new Div('SP__warning-card')
    const title = new Div('SP__warning-card__title').html('Mensagens')
    this.card.append(title, content)
    this.container.append(this.card)
  }

  buildContent(){
    this.wrapper = new Div('SP__warning-card__content')
    this.warning = new Div('SP__warning-card__content__date').html('Mensagem Recebidas')
    this.title = new Div('SP__warning-card__content__title').html('Mensagem Enviadas')
    this.wrapper.append(this.warning, this.title)
    return this.wrapper
  }

  getView() {
    return this.container
  }
}
