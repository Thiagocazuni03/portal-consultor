import { Div } from "../utils/Prototypes.js"
import Sheet from '../core/Sheet.js'
import Translator from '../translation/Translator.js'
import Session from '../core/Session.js'

export default class DashboardSummary {

  constructor(config = {}) {

    this.config = Object.assign({
      items: [],
      css: '',
    }, config)

    // this.master = new Div('dashboard')
    this.master = new Div()
    this.summary = new Div('dashboard__summary dashboard')

    this.master.addClass(this.config.css)
    this.master.append(this.summary)

    this.build()
  }

  build() {
    this.summary.empty()

    this.config.items.forEach(item => {
      this.summary.append(this.createCard(item))
    })
    this.createAwardsView()
  }

  createAwardsView(){
    this.awardsContainer = new Div('dashboard__awards')
    this.master.append(this.awardsContainer)
    this.awardsSheet = new Sheet(this.getSheetConfig())
    this.awardsContainer.append(new Div('awwards').append(Translator.t('dashboard:awards2')))
    this.awardsContainer.append(this.awardsSheet.getView())
  }

  getSheetConfig(){
    return  {
            //  whenScrollHitBottom: () => this.fetchAndAddItems(),
             css: 'isSalesSheet',
             align: 'center',
             maxHeight: '100%',
             scrollabe: true,
             clickableRows: true,
             render: {
                items:[],
                createFunc: (data, index, array) => alert('b') && this.createTableRow(data, index, array),
                onRender: (render) => {
                  
                   if (!this.awardsSheet) return
    
                   const contentHeight = this.pageContent[0].clientHeight
                   const tableHeight = this.awardsSheet.getView()[0].clientHeight
                   const tableIsOverflowing = tableHeight >= contentHeight
    
                   this.awardsSheet.getView().css('overflow', tableIsOverflowing ? 'overlay' : 'visible')
                },
                hasLoader:false,
                identifierKey: 'identifier',
                hasAnimation: true,
             },
             layout: [
                {
                   keys: ['status'],
                   label: Translator.t('dashboard:placing'),
                   size: '50%',
                  //  transform: (value) => this.createStatusBadge(value)
                },
                {
                   keys: ['date'],
                   label: Translator.t('dashboard:award'),
                   size: '50%',
                   color: 'var(--fifth)',
                  //  transform: (value) => this.createDateFormated(value)
                },
                
             ],
          }
  }

  createTableRow(data, index, array) {
    
    //Vai pra aba de editar o draft
    const goToOrderEdit = () => {
        Session.set('openCartAuto', true)
        Session.set('currentDraftID', data.identifier)
        Session.set('currentDraftIndex', data.id)
        window.location.href = './catalog.html'
    }

    //Criando a linha
    const tableRow = this.awardsSheet.createBodyItem(data)
    const lastTd = tableRow.children(':last-child')

    tableRow.css('z-index', array.length - index)

    if (!data.status) {
        lastTd.append(new DotsMenu({
          menuIndex: 10,
          zIndex: '',
          options: [
              {
                text: Translator.t('actions:edit'),
                onClick: () => goToOrderEdit()
              },
              {
                text: Translator.t('actions:finish'),
                onClick: () => {
                    const identifier = String(data.identifier)
                    const prompt = new OrderClosePrompt(identifier)

                    prompt.setOnSuccess(() => {
                      const newTime = new Date()
                          .toLocaleString('en-GB')
                          .replaceAll('/', '-')
                          .replaceAll(',', '')

                      const newStatus = 16
                      const newRow = { ...data, date: newTime, status: newStatus }

                      this.currentRender.editItem(identifier, newRow)
                    })

                    prompt.show()
                }
              },
              {
                text: Translator.t('actions:delete'),
                color: 'var(--red)',
                isBold: true,
                onClick: () => {
                    
                    const identifier = String(data.identifier)
                    const prompt = new OrderDeletionPrompt(identifier)

                    prompt.setOnSuccess(() => this.currentRender.deleteItem(identifier))
                    prompt.show()
                }
              }
          ]
        }).getView())
    }

    return tableRow
  }

  createCard({ value = 0, label = '', color = 'orange' }) {

    const card = new Div('summary-card')
    card.addClass(`summary-card--${color}`)

    const circle = new Div('summary-card__circle')
    const valueNode = new Div('summary-card__value').append(value)

    const labelNode = new Div('summary-card__label').append(label)

    circle.append(valueNode)
    card.append(circle, labelNode)

    return card
  }

  setItems(items = []) {
    this.config.items = items
    this.build()
  }

  getView() {
    return this.master
  }
}
