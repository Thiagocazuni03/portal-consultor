import { Div, Label, Input, Button } from "../../utils/Prototypes.js"

export default class ResetPassword {

  constructor() {
    this.container = new Div('')
    this.card = new Div('SP__password-card')
    this.formRow = new Div('SP__row')

    this.title = new Div('SP__password-card__title')
    this.title.text('Alterar Senha')

    this.formRow.append(
      this.buildPasswordField('Senha Atual', 'current_password'),
      this.buildPasswordField('Nova Senha', 'new_password'),
      this.buildPasswordField('Repita a Nova Senha', 'confirm_password')
    )

    this.button = new Button('SP__password-card__button')
    this.button.append('ALTERAR')

    this.card.append(this.title, this.formRow, this.button)
    this.container.append(this.card)
  }

  /* =====================================================
     GRID WRAPPER
  ===================================================== */
  createFieldWrapper({ desktop = 12, mobile = 12 }) {
    const col = new Div('SP__col')
    col.addClass(`col-${desktop}`)
    col.addClass(`col-m-${mobile}`)
    return col
  }

  /* =====================================================
     PASSWORD FIELD
  ===================================================== */
  buildPasswordField(labelText, name) {
    const col = this.createFieldWrapper({ desktop: 12, mobile: 12 })

    const field = new Div('SP__input')
    const label = new Label()
    const input = new Input()

    label.text(labelText)
    input.attr('type', 'password')
    input.attr('name', name)

    field.append(label, input)
    col.append(field)

    return col
  }

  getView() {
    return this.container
  }
}
