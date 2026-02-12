import { Div, Span, H1, Strong, A } from "../../../utils/Prototypes.js"

export default class WelcomeProgram {

   constructor(config = {}) {
      this.config = {
         name: config.name || 'Rodrigo',
         date: config.date || '17/12/2025',
         type: config.type || 'Individual',
         program: config.program || 'AMOPONTOS 2025',
         isParticipant: config.isParticipant || false,
         link: config.link || './home.html'
      }

      this.container = new Div('wrapper')

      this.build()
   }

   build() {
      this.buildWelcome()
      this.buildInfo()
      this.buildCTA()
   }

   buildWelcome() {
      const welcome = new Div('welcome-wrapper')

      const span = new Span().text('Bem-vindo(a)')

      const title = new H1('welcome').append(
         'Olá, ',
         new Strong().text(this.config.name),
         '<br>',
         `${this.config.date} – (${this.config.type})`
      )

      welcome.append(span, title)
      this.container.append(welcome)
   }

   buildInfo() {
      const info = new Div('info')

      if (this.config.isParticipant) {
         info.append(
            'Você já está participando do Programa de Pontos: ',
            new Strong().text(this.config.program)
         )
      } else {
         info.append(
            'Você ainda ',
            new Strong().text('não está participando'),
            ' do Programa de Pontos: ',
            new Strong().text(this.config.program)
         )
      }

      this.container.append(info)
   }

   buildCTA() {
      const cta = new Div('cta')

      const link = new A()
      link.attr('href', this.config.link)
      link.text('Clique aqui para participar')

      cta.append(link)
      this.container.append(cta)
   }

   getView() {
      return this.container
   }

}
