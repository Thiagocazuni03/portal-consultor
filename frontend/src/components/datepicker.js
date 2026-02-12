import $ from 'jquery'
import { Div, Input, Icon } from "../utils/Prototypes.js"

export default class PeriodPicker {

    constructor(config={}) {

        this.config = $.extend({
            label: 'Período',
            placeholder: 'Selecione o período...',
            css: '',
            width: '100%',
            onChange: () => {},
            blockPreviousDays:false
        }, config)

        // Datas selecionadas
        this.startDate = null
        this.endDate = null
        this.selectingStart = true

        // ROOT container
        this.container = new Div('PP__container ' + this.config.css)
            .css({ width: this.config.width, position: 'relative' })

        // LABEL
        this.label = new Div('PP__label').html(this.config.label)

        // INPUT
        this.input = new Input('PP__input')
            .attr('placeholder', this.config.placeholder)
            .on('click', () => this.toggleCalendar())

        // CALENDAR wrapper
        this.calendar = new Div('PP__calendar hidden')

        // CABEÇALHO DO CALENDÁRIO
        this.header = new Div('PP__header')

        this.prev = new Icon('PP__navPrev').html('<')
        this.next = new Icon('PP__navNext').html('>')

        this.monthLabel = new Div('PP__month')

        this.header.append(this.prev, this.monthLabel, this.next)

        // GRID DE DIAS
        this.grid = new Div('PP__grid')

        // Cabeçalho dos dias da semana
        this.weekHeader = new Div('PP__week')
        this.weekHeader.append(
            new Div('PP__week__day').html('DOM'),
            new Div('PP__week__day').html('SEG'),
            new Div('PP__week__day').html('TER'),
            new Div('PP__week__day').html('QUA'),
            new Div('PP__week__day').html('QUI'),
            new Div('PP__week__day').html('SEX'),
            new Div('PP__week__day').html('SÁB')
        )

        this.calendar.append(this.header, this.weekHeader, this.grid)


        // this.calendar.append(this.header, this.grid)

        // ADD elements ao container
        this.container.append(this.label, this.input, this.calendar)

        // Estados atuais
        const today = new Date()
        this.currentMonth = today.getMonth()
        this.currentYear = today.getFullYear()

        // Eventos navegação
        this.prev.on('click', () => {
            this.currentMonth--
            if (this.currentMonth < 0) {
                this.currentMonth = 11
                this.currentYear--
            }
            this.renderCalendar()
        })

        this.next.on('click', () => {
            this.currentMonth++
            if (this.currentMonth > 11) {
                this.currentMonth = 0
                this.currentYear++
            }
            this.renderCalendar()
        })

        // Fechar ao clicar fora
        $(document).on('mousedown', (e) => {
            if (!this.container[0].contains(e.target)) {
                this.calendar.addClass('hidden')
            }
        })

        this.renderCalendar()
    }

    // Retorna o container do componente
    getView() {
        return this.container
    }

   setRange(start, end) {
        this.startDate = PeriodPicker.parseISODate(start)
        this.endDate = PeriodPicker.parseISODate(end)
        this.selectingStart = true

        this.input.val(
            `${PeriodPicker.formatBR(this.startDate)} - ${PeriodPicker.formatBR(this.endDate)}`
        )

        this.renderCalendar()
    }



    // Mostra/esconde calendário
    toggleCalendar() {
        this.calendar.toggleClass('hidden')
    }

    static parseISODate(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number)
        return new Date(y, m - 1, d) // ← local, sem UTC
    }


    // Converte yyyy-mm-dd
    static toISO(date) {
        return date.toISOString().split('T')[0]
    }

    // dd/mm/yyyy
    static formatBR(date) {
        return date.toLocaleDateString('pt-BR')
    }

    // Renderiza calendário
    renderCalendar() {
        const monthNames = [
            "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
            "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
        ]

        this.monthLabel.html(`${monthNames[this.currentMonth]} ${this.currentYear}`)

        this.grid.empty()

        let first = new Date(this.currentYear, this.currentMonth, 1)
        let last = new Date(this.currentYear, this.currentMonth + 1, 0)
        let start = first.getDay()

        let daysInMonth = last.getDate()

        // Espaços vazios antes do dia 1
        for (let i = 0; i < start; i++) {
            this.grid.append(new Div('PP__day empty'))
        }

        const today = new Date()
        today.setHours(0,0,0,0)

        for (let d = 1; d <= daysInMonth; d++) {

            const date = new Date(this.currentYear, this.currentMonth, d)
            date.setHours(0,0,0,0)
            const iso = PeriodPicker.toISO(date)

            let day = new Div('PP__day').html(d)

            // desabilitar dias passados
            const isPast = date < today

            if (isPast && this.config.blockPreviousDays) {
                day.addClass('past')
            } else {
                day.on('click', () => this.handleSelection(date))
            }

            // marca selecionados
            if (this.startDate && iso === PeriodPicker.toISO(this.startDate)) {
                day.addClass('start')
            }
            if (this.endDate && iso === PeriodPicker.toISO(this.endDate)) {
                day.addClass('end')
            }

            // range highlight
            if (this.startDate && this.endDate) {
                if (date > this.startDate && date < this.endDate) {
                    day.addClass('in-range')
                }
            }

            this.grid.append(day)
        }

    }

    handleSelection(date) {
        if (!this.startDate || !this.endDate) {
            // primeira seleção
            if (this.selectingStart) {
                this.startDate = date
                this.endDate = null
                this.selectingStart = false
            } else {
                // se mesma data → período de 1 dia
                if (date < this.startDate) {
                    this.endDate = this.startDate
                    this.startDate = date
                } else {
                    this.endDate = date
                }
                this.selectingStart = true
            }
        } else {
            // reset seleção
            this.startDate = date
            this.endDate = null
            this.selectingStart = false
        }

        console.log('handleSelection');
        
        
        // Atualiza input
        if (this.startDate && this.endDate) {   
            
            this.input.val(
                `${PeriodPicker.formatBR(this.startDate)} - ${PeriodPicker.formatBR(this.endDate)}`
            ) 
            this.config.onChange({
                start: PeriodPicker.toISO(this.startDate),
                end: PeriodPicker.toISO(this.endDate)
            })
            this.calendar.addClass('hidden')
        }

        this.renderCalendar()
    }
}
