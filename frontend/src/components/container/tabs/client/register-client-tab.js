import { Div, Label, Input } from "../../../../utils/Prototypes.js"

export default class RegisterClient {

  constructor(data = {}) {
    this.data = data

    this.container = new Div('SP__points-program__bonus-tab')
    this.header = new Div('bonus-hd')
    this.formRow = new Div('SP__row')

    this.formRow.append(
      this.buildInput('Nome Vendedor', 'name', { desktop: 6, mobile: 12 }),
      this.buildInput('Cód Cliente', 'email', { desktop: 6, mobile: 12 }),
      this.buildInput('Nome', 'phone', { desktop: 4, mobile: 12 }),
      this.buildInput('Razão Social', 'cpf', { desktop: 4, mobile: 12 }),
      this.buildInput('Endereço', 'cnpj', { desktop: 4, mobile: 12 }),
      this.buildInput('Número', 'number', { desktop: 4, mobile: 12 }),
      this.buildInput('Bairro', 'address', { desktop: 8, mobile: 12 }),
      this.buildInput('UF', 'complement', { desktop: 4, mobile: 12 }),
      this.buildInput('CEP', 'neighborhood', { desktop: 4, mobile: 12 }),
      this.buildInput('Cidade', 'city', { desktop: 6, mobile: 12 }),
      this.buildInput('Região', 'state', { desktop: 6, mobile: 12 }),
      this.buildInput('DDD', 'state', { desktop: 6, mobile: 12 }),
      this.buildInput('Telefone(1)', 'state', { desktop: 6, mobile: 12 }),
      this.buildInput('Telefone(2)', 'state', { desktop: 6, mobile: 12 }),
      this.buildInput('Contato(1)', 'state', { desktop: 6, mobile: 12 }),
      this.buildInput('Contato(2)', 'state', { desktop: 6, mobile: 12 }),
      this.buildInput('Inclusão', 'state', { desktop: 6, mobile: 12 }),
      this.buildInput('Endereço eletrônico', 'state', { desktop: 6, mobile: 12 }),
      this.buildInput('Observação', '', { desktop: 6, mobile: 12 })
    )

    this.header.append(this.formRow)
    this.container.append(this.header)
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
     INPUT GENÉRICO
  ===================================================== */
  buildInput(labelText, name, size) {
    const col = this.createFieldWrapper(size)

    const field = new Div('SP__input')
    const label = new Label()
    const input = new Input()

    label.text(labelText)
    input.attr('name', name)
    input.val(this.data[name] ?? '')

    field.append(label, input)
    col.append(field)

    return col
  }

  getView() {
    return this.container
  }
}
