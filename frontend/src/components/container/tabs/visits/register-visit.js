import { Div, Label, Input, Button, TextArea } from "../../../../utils/Prototypes.js"

export default class RegisterClient {

  constructor(data = {}) {
    this.data = data
    this.subjectIndex = 1
    this.subjectGroups = []

    /* Containers principais */
    this.container = new Div('SP__register-visit')
    this.header = new Div('')
    this.formRow = new Div('SP__row')

    /* =============================
       CAMPOS FIXOS
    ============================= */
    this.formRow.append(
      this.buildInput('Data Cad', 'date_register', { desktop: 12, mobile: 12 }),
      this.buildInput('Data Visita', 'date_visit', { desktop: 12, mobile: 12 }),
      this.buildInput('Contato', 'contact', { desktop: 12, mobile: 12 }),
      this.buildInput('Endereço', 'address', { desktop: 12, mobile: 12 }),
      this.buildInput('Número', 'number', { desktop: 12, mobile: 12 })
    )

    /* =============================
       CONTAINER DE ASSUNTOS
    ============================= */
    this.subjectContainer = new Div('SP__subjects col-12')
    this.formRow.append(this.subjectContainer)

    /* Primeiro assunto */
    this.addSubject()

    /* =============================
       BOTÃO ADICIONAR ASSUNTO
    ============================= */
    this.addSubjectButton = new Button()
    this.addSubjectButton.text('Adicionar assunto')
    this.addSubjectButton.on('click', () => this.addSubject())

    this.formRow.append(
      this.createFieldWrapper({ desktop: 12, mobile: 12 })
        .append(this.addSubjectButton)
    )

    this.header.append(this.formRow)
    this.container.append(this.header)
  }

  /* =====================================================
     ADICIONAR ASSUNTO
  ===================================================== */
  addSubject() {
    const index = this.subjectIndex

    const group = new Div('SP__subject-group')

    const subjectInput = this.buildInput(
      `Assunto ${index}`,
      `subject_${index}`,
      { desktop: 12, mobile: 12 }
    )

    const commentInput = this.buildTextArea(
      `Comentário ${index}`,
      `comment_${index}`,
      { desktop: 12, mobile: 12 }
    )

    /* Botão remover */
    const removeBtn = new Button()
    removeBtn.text('Remover')
    removeBtn.on('click', () => this.removeSubject(group))

    const removeCol = this.createFieldWrapper({ desktop: 12, mobile: 12 })
    removeCol.append(removeBtn)

    group.append(subjectInput, commentInput, removeCol)

    this.subjectContainer.append(group)
    this.subjectGroups.push(group)

    this.subjectIndex++
  }

  /* =====================================================
     REMOVER ASSUNTO
  ===================================================== */
  removeSubject(group) {
    if (this.subjectGroups.length <= 1) return

    group.remove()
    this.subjectGroups = this.subjectGroups.filter(g => g !== group)

    this.reindexSubjects()
  }

  /* =====================================================
     REORGANIZAR ÍNDICES
  ===================================================== */
  reindexSubjects() {
    this.subjectIndex = 1

    this.subjectGroups.forEach(group => {
      const inputs = group.find('input')

      const subjectInput = inputs.eq(0)
      const commentInput = inputs.eq(1)

      const subjectLabel = subjectInput.closest('.SP__input').find('label')
      const commentLabel = commentInput.closest('.SP__input').find('label')

      subjectLabel.text(`Assunto ${this.subjectIndex}`)
      commentLabel.text(`Comentário ${this.subjectIndex}`)

      subjectInput.attr('name', `subject_${this.subjectIndex}`)
      commentInput.attr('name', `comment_${this.subjectIndex}`)

      this.subjectIndex++
    })
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

  buildTextArea(labelText, name, size) {
    const col = this.createFieldWrapper(size)

    const field = new Div('SP__textarea')
    const label = new Label()
    const input = new TextArea()

    label.text(labelText)
    input.attr('name', name)
    input.val(this.data[name] ?? '')

    field.append(label, input)
    col.append(field)

    return col
  }

  /* =====================================================
     VIEW
  ===================================================== */
  getView() {
    return this.container
  }
}
