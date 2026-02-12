import $ from 'jquery'
export default class TabView {
   constructor({
      defaultTab = null,
      indicator = 'line',
      css = '',
      contentTarget = null
   } = {}) {

      // Estado
      this.tabs = {}
      this.activeTab = null
      this.defaultTab = defaultTab
      this.indicator = indicator

      // Root (header)
      this.root = $('<div>', {
         class: `tab-view ${css}`
      })

      // Header
      this.header = $('<div>', {
         class: 'tab-view-header'
      })

      // Content WRAPPER (sempre existe)
      this.content = $('<div>', {
         class: 'tab-view-content'
      })

      // Onde o wrapper será inserido
      this.contentTarget = contentTarget

      this.root.append(this.header)

   }

   appendContent(){
       // Se houver target, o wrapper vai pra lá
      if (this.contentTarget) {
         this.contentTarget.append(this.content)
      } else {
         this.root.append(this.content)
      }
   }

   addTab({ id, label, icon = null, onSelect = null, disabled = false }) {
      if (!id) throw new Error('Tab precisa de um id')

      const tabBtn = $('<button>', {
         class: 'tab-view-tab' 
      })

      if (icon) {
         const iconView = typeof icon === 'string'
            ? $('<i>', { class: icon })
            : icon

         tabBtn.append(iconView)
      }

      tabBtn.append($('<span>', { text: label }))

      if (disabled) {
         tabBtn.addClass('isDisabled')
         tabBtn.prop('disabled', true)
      }

      tabBtn.on('click', () => {
         console.log('click');
         
         if (disabled) return
         this.selectTab(id)
         onSelect?.(id)
      })

      this.tabs[id] = {
         id,
         button: tabBtn,
         content: null
      }

      this.header.append(tabBtn)

      if (!this.activeTab && (this.defaultTab === id || !this.defaultTab)) {
         this.selectTab(id)
      }

      return this
   }

   setContent(tabId, view) {
      if (!this.tabs[tabId]) return

      this.tabs[tabId].content = view

      // Append the view to the content div and hide it initially
      this.content.append(view)
      view.hide()

      if (this.activeTab === tabId) {
         view.show()
      }
   }

   selectTab(tabId) {
      if (!this.tabs[tabId]) return
      if (this.activeTab === tabId) return

      this.activeTab = tabId

      Object.values(this.tabs).forEach(tab => {
         tab.button.removeClass('isActive isHighlight')
      })

      const activeButton = this.tabs[tabId].button
      activeButton.addClass('isActive')

      if (this.indicator === 'highlight') {
         activeButton.addClass('isHighlight')
      }

      this.renderContent(tabId)
   }

   renderContent(tabId) {
      // Hide all content views
      this.content.children().hide()

      const view = this.tabs[tabId]?.content
      if (view) {
         view.show()
      }
   }

   /**
    * Retorna apenas o HEADER
    */
   getView() {
      return this.root
   }
}
