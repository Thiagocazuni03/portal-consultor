import { BRAND, CURRENCY, STORAGE_URL } from '../../api/Variables.js'
import Dropdown from '../../core/Dropdown.js'
import Item from '../../core/Item.js'
import Tab from '../../components/Tab.js'
import MoneyViewer from '../../core/MoneyViewer.js'
import Renderer from '../../core/Renderer.js'
import Tooltip from '../../core/Tooltip.js'
import Utils from '../../core/Utils.js'
import Sheet from '../../core/Sheet.js'
import PopUp from '../../core/PopUp.js'
import UserStorage from '../../core/UserStorage.js'
import Badge from '../../core/Badge.js'
import { Div, H4, Header, Icon, Img } from '../../utils/Prototypes.js'
import LoadingModal from '../../business/general/LoadingModal.js'
import DataCart from '../../system/DataCart.js'
import CartItem from '../../business/general/CartItem.js'
import * as htmlToImage from 'html-to-image'
import { jsPDF } from 'jspdf'
import $ from 'jquery'

export default class OrderFinishTab extends Tab {
   constructor(config) {
      super({
         hasTitle: false,
         hasDesc: false,
         hasOptions: false,
         hasInfo: false,
         scrollable: true,
         hasFooter: true,
         openAnimation: 'appear',
         rightButtonText: 'Baixar',
         leftButtonText: 'Voltar',
         css: 'isOrderFinishTab',
         onRightButtonClick: () => this.downloadPDF(),
         onLeftButtonClick: () => window.location.href = './sales.html',
         ...config
      })


      //Dados
      this.products = this.config.products
      this.orderData = this.config.orderData
      this.showMarkup = this.config.showMarkup

      
      
      //Formatado
      // const dateFormated = this.orderData.order.created.split(' ')[0].split('-').map(val => val.padStart(2, '0')).reverse().join('/')
      // const hourFormated = this.orderData.order.created.split(' ')[1]
      // const buyerName = this.orderData.order.order.buyer.name
      // const draftNumber = this.orderData.order.order.id
      
      const dateFormated = this.orderData.created.split(' ')[0].split('-').map(val => val.padStart(2, '0')).reverse().join('/')
      const hourFormated = this.orderData.created.split(' ')[1]
      const buyerName = this.orderData.buyer.name
      const draftNumber = this.orderData.identifier

      const draftTitle = Item.title(`Orçamento #${draftNumber}`)

      draftTitle.css('width', 'fit-content')

      new Badge({
         on: draftTitle,
         color: this.showMarkup ? 'var(--fifth)' : 'transparent',
         textColor: this.showMarkup ? 'white' : 'var(--fifth)',
         border: this.showMarkup ? 'transparent' : 'var(--fifth)',
         title: this.showMarkup ? 'Pedido' : 'Cotação',
         round: false,
         padding: '0.25rem',
         top: 50,
         left: 105,
         hasIcon: false,
         transform: [0, '-50%']
      })

      //Header com o item
      const headerItem = new Item({
         columns: ['1fr', '60px'],
         left: [
            Item.brand(BRAND),
            draftTitle,
         ],
         style: { right: { cursor: 'pointer' } },
         right: Item.image(this.orderData.member.image),
         css: 'isOrderFinishHeader'
      })

      //Nome da empresa
      new Tooltip({
         content: Tooltip.text(this.orderData.member.name),
         position: 'left',
         on: headerItem.right
      })

      this.header.css('border-bottom', '1px solid var(--fourth)')

      //Dropdown dos produtos
      const productsDropdown = new Dropdown({
         disabled: true,
         css: 'isFinishedOrderDropdown isProducts',
         icon: null,
         open: true,
         title: `Produtos (${this.products.length})`,
         gap: '0.5rem',
      })

      //Onde os produtos serão renderizados
      const productsRender = new Renderer({
         css: 'isSaleViewRender',
         items: this.products,
         hasGoToTopButton: false,
         createFunc: (product, index, array) => this.createProduct(product, index, array),
         sortFunc: (items) => items.sort((itemA, itemB) => itemA.time - itemB.time)
      })

      productsDropdown.appendToContent(productsRender.getView())

      //Objecto de cobrança
      const moneyDetails = [
         { title: 'Produtos', operator: '+', value: this.products.reduce((total, product) => total + this.showMarkup ? product.extract.markuped : product.extract.total, 0) },
         { title: 'Adicionais', operator: '+', value: this.products.reduce((total, product) => total + (product.extract.additional ?? 0), 0) },
         { title: 'Garantia', operator: '+', value: this.products.reduce((total, product) => total + (product.warranty.total ?? 0), 0) },
         { title: 'Desconto', operator: '-', value: 0 }
      ]

      //A tabela de cobrança
      const moneySheet = new Sheet({
         css: 'isFinishedOrderTable',
         render: { items: moneyDetails },
         layout: [
            {
               keys: [],
               label: '',
               size: '5%',
            },
            {
               keys: ['title'],
               label: 'Referente',
               size: '55%',
               align: 'left'
            },
            {
               keys: ['value', 'operator'],
               label: `Preço (${CURRENCY})`,
               bold: true,
               size: '40%',
               transform: (value, operator) => `${operator} ${Number(value).toFixed(2)}`,
               css: (value) => value > 0 && { color: 'var(--green)' }
            }
         ]
      })

      //Dropdown de detalhes
      const detailsDropdown = new Dropdown({
         disabled: true,
         css: 'isFinishedOrderDropdown',
         open: true,
         icon: null,
         title: `Cobrança (${CURRENCY} ${this.products.reduce((total, product) => total + product.extract.total, 0).toFixed(2)})`,
         gap: '0.5rem',
         appendToContent: moneySheet.getView()
      })

      //Dropdown do vendedor
      const sellerDropdown = new Dropdown({
         css: 'isFinishedOrderDropdown',
         disabled: true,
         open: true,
         title: 'Vendedor',
         icon: null,
         gap: '0.5rem',
         appendToContent: this.createPersonCard(this.orderData.seller)
      })

      //Seção de bem-vindo
      const welcomeSection = new Item({
         columns: ['1fr', '0px', '0px'],
         css: 'isHuge',
         style: {
            item: {
               border: 'none',
               marginLeft: '2rem',
               width: 'calc(100% - 4rem)',
            },
            main: {
               padding: 0
            }
         },
         left: [
            Item.title(`Olá ${buyerName}, veja o resumo de seu orçamento.`),
            Item.desc(`Realizado no dia ${dateFormated} ás ${hourFormated}.`)
         ]

      })

      this.appendToHeader(headerItem.getView())
      this.appendToContent(welcomeSection.getView())
      this.appendToContent(productsDropdown.getView())
      this.appendToContent(detailsDropdown.getView())
      this.appendToContent(sellerDropdown.getView())

      detailsDropdown.update()
      productsDropdown.update()
      sellerDropdown.update()
   }

   /**
   * Cria um produto do orçamento e retorna para visualização 
   */
   createProduct(product, index) {
      const dataCart = new DataCart(product)
      const cartItem = new CartItem({ 
         dataCart, 
         index 
      })

      return cartItem.getView()
   }

   /**
    * Cria um card com os dados do cliente
    */
   createPersonCard({ name, document, email, phone }) {
      const buyerWrapper = new Div('SP__buyer')
      const buyerTitle = new H4('SP__buyer__title')
      const buyerInfo = new Div('SP__buyer__info')

      buyerTitle.text(name)
      buyerWrapper.append(buyerTitle, buyerInfo)

      const buyerInfoRows = [
         { label: 'Documento', icon: 'ic-document', text: this.formatDocument(document) ?? 'Sem documento', hasInfo: !!document },
         { label: 'Telefone', icon: 'ic-phone', text: phone || 'Sem telefone', hasInfo: !!phone },
         { label: 'Email', icon: 'ic-email', text: email || 'Sem email', hasInfo: !!email }
      ]

      buyerInfoRows.forEach(({ icon, text, label, hasInfo }) => {

         const item = new Div('SP__buyer__info__item')
         const itemIcon = new Icon('SP__buyer__info__item__icon')
         const itemText = new Div('SP__buyer__info__item__text')

         item.attr('data-info', hasInfo)
         itemIcon.addClass(icon)
         itemText.text(text)
         item.append(itemIcon, itemText)
         buyerInfo.append(item)

         item.click(() => {
            if (!hasInfo) return
            navigator.clipboard.writeText(text)
            PopUp.triggerCopy(`${label} copiado com sucesso`, this.tab, 'BUYER_INFO_COPY')
         })
      })

      return buyerWrapper
   }

   /**
    * Recebe uma string e a formata para um CPF com traços e pontos 
    */
   formatDocument(document) {
      if (!document) return null

      return document.replace(/\D/gi, '').split('').map((number, index) => {
         if (index === 2) return number + '.'
         if (index === 5) return number + '.'
         if (index === 8) return number + '-'
         return number
      }).join('')
   }

   /**
    * Baixa o PDF da venda
    */
   async downloadPDF() {

      const container = new Div('SP__salepdf__container')
      const content = new Div('SP__salepdf')

      const productsLabel = new Div('SP__salepdf__label').text('Produtos')
      const summaryLabel = new Div('SP__salepdf__label').text('Sumário')

      const header = await this.createPDFHeader()
      const people = await this.createPDFUsers()
      const products = await this.createPDFCart()
      const summary = await this.createPDFSummary()

      container.append(content)
      content.append(
         header,
         people,
         productsLabel,
         products,
         summaryLabel,
         summary
      )

      this.appendAsHidden(container)
      this.generatePDFAndDownload(container, content)
   }

   /**
    * Adiciona um elemento na página de forma escondida
    * @param {JQuery} element Um elemento 
    */
   appendAsHidden(element) {
      $('body').append(element)
   }

   /**
    * Gera a imagem do PDF e seu documento
    * @param {JQuery} container O container dentro
    * @param {JQuery} content O elemento da tabela
    */
   async generatePDFAndDownload(container, element) {
      const loadingModal = new LoadingModal({
         autoOpen: true,
         title: 'Aguarde',
         message: 'Estamos __gerando__ seu PDF, seu __download__ começará em breve.',
      })

      try {

         const images = await this.createPDFImages(container, element)
         const document = new jsPDF({
            orientation: 'portrait',
            format: 'a4',
            encryption: { userPermissions: ['print'] }
         })

         document.deletePage(1)
         document.setDocumentProperties({
            title: `${this.showMarkup ? 'Pedido' : 'Cotação'} #${this.orderData.identifier}`,
            author: `${this.getSellerNameWithID()} | ${this.getMemberNameWithID()}`,
            subject: this.orderData.buyer.name
         })

         images.forEach(base64 => {
            document.addPage()
            document.addImage(base64, 'JPEG', 0, 0, 210, 297)
         })

         await document.save(`${BRAND} - ${this.showMarkup ? 'Pedido' : 'Cotação'} #${this.orderData.identifier}.pdf`, { returnPromise: true })

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Houve um erro ao gerar seu PDF. Contate o desenvolvedor.', this.tab, null)

      } finally {

         loadingModal.closeModal()
         container.remove()

      }
   }

   /**
    * Retorna o nome do vendedor com o id
    * @returns {string} O nome do vendedor com o id
    */
   getSellerNameWithID() {
      return `${this.orderData.seller.name} (#${this.orderData.seller.id})`
   }

   /**
    * Retorna o nome do vendedor com o id
    * @returns {string} O nome do vendedor com o id
    */
   getMemberNameWithID() {
      return `${this.orderData.member.name} (#${this.orderData.member.id})`
   }

   /**
    * Cria a imagem do formulário
    * @param {JQuery} container O container do elemento
    * @param {JQuery} element Um elemento
    * @returns {Promise<string[]>} O base64 da imagem
    */
   async createPDFImages(container, element) {

      const imageSlices = []
      const pagesNumber = Math.ceil(element.outerHeight() / this.getPDFPageHeightInPixels())

      while (imageSlices.length < pagesNumber) {
         const sliceNum = imageSlices.length
         const sliceBase64 = await this.printElementSlice(container, element, sliceNum)

         imageSlices.push(sliceBase64)
      }

      return imageSlices
   }

   /**
    * Pega um pedaço da imagem de um elemento
    * @param {JQuery} container O elemento pai
    * @param {JQuery} element O elemnento
    * @param {number} sliceNum O número da fatia
    * @param {number} scale A escala sendo utilizada
    * @returns {Promise<string>} Um base64 do elemento
    */
   async printElementSlice(container, element, sliceNum, scale = 3) {

      const topDistance = sliceNum * this.getPDFPageHeightInPixels()
      const elementClone = element.clone()

      const scaledWidth = this.getMilimitersAsPixels(210) * scale
      const scaledHeight = this.getMilimitersAsPixels(297) * scale

      elementClone.css({
         position: 'absolute',
         left: '0',
         top: -topDistance + 'px'
      })

      void (container[0].offsetHeight)
      void (elementClone[0].offsetHeight)

      container.empty()
      container.append(elementClone)

      return htmlToImage.toJpeg(container[0], {
         quality: 1,
         width: scaledWidth,
         canvasWidth: scaledWidth,
         canvasHeight: scaledHeight,
         height: scaledHeight,
         skipAutoScale: true,
         style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
         }
      })
   }

   /**
    * Transforma milimetros em íxels
    * @param {number} milimeters Os milimetros
    * @returns {number} O tamanho em pixels 
    */
   getMilimitersAsPixels(milimeters) {
      return milimeters / 0.264583
   }

   /**
    * Retorna o tamanho de uma página de um PDF em milimetros
    * @returns {number} 
    */
   getPDFPageHeightInPixels() {
      return this.getMilimitersAsPixels(297)
   }

   /**
    * Cria o header do PDF
    * @returns {Promise<JQuery>} O node do header
    */
   async createPDFHeader() {
      const header = new Header('SP__salepdf__header')
      const logo = new Img('SP__salepdf__header__logo')
      const info = new Div('SP__salepdf__header__info')
      const brand = new Div('SP__salepdf__header__info__brand')
      const title = new Div('SP__salepdf__header__info__title')
      const date = new Div('SP__salepdf__header__info__date')

      brand.text(BRAND)
      
      // title.text(`${this.showMarkup ? 'Pedido' : 'Cotação'} #${this.orderData.order.order.id}`)
      title.text(`${this.showMarkup ? 'Pedido' : 'Cotação'} #${this.orderData.identifier}`)
      date.text(`Realizado em ${new Date(this.orderData.created).toLocaleString('en-GB').split(', ').join(' às ')}`)
      header.append(logo, info)
      info.append(brand, title, date)

      UserStorage.getMemberInfo('image').then(url => logo.attr('src', url))
 
      return header
   }

   /**
    * Cria a seção de pessoas do PDF
    * @returns {Promise<JQuery>}
    */
   async createPDFUsers() {
      const wrapper = new Div('SP__salepdf__people')
      const buyer = new Div('SP__salepdf__people__card')
      const seller = new Div('SP__salepdf__people__card')
      const reseller = new Div('SP__salepdf__people__reseller')

      buyer.append(this.createCardInfo(this.getBuyerInfoForCard()))

      seller.append(this.createCardInfo(this.getSellerInfoForCard()))

      reseller.append(this.createResellerInfo(await this.getResellerInfo()))

      wrapper.append(
         reseller,
         seller,
         buyer
      )

      return wrapper
   }

   /**
    * Retorna os dados do vendedor para o cartão
    * @returns {object} Os dados do seller
    */
   getSellerInfoForCard() {
      const sellerInfo = this.orderData.seller
      const cardInfo = {
         role: 'Vendedor',
         name: sellerInfo.name,
         email: sellerInfo.email
      }

      return cardInfo
   }

   /**
    * Retorna os dados do comprador
    * @returns {object} Um objeto com os dados do comprador
    */
   getBuyerInfoForCard() {
      const buyerInfo = this.orderData.buyer
      const cardInfo = {
         role: 'Cliente',
         name: buyerInfo.name,
         document: buyerInfo.document ?? 'Sem documento',
         email: buyerInfo.email ?? 'Sem email',
         phone: buyerInfo.phone ?? 'Sem telefone'
      }

      return cardInfo
   }

   /**
    * Retorna os dados da revenda
    * @returns {Promise<object>} Um objeto com os dados da revenda
    */
   async getResellerInfo() {
      const resellerInfo = this.orderData.member
      const cardInfo = {
         role: 'Revenda',
         name: resellerInfo.name,
         document: Utils.formatCNPJ(resellerInfo.document),
         email: resellerInfo.email ?? 'Sem email',
         phone: resellerInfo.phone ?? 'Sem telefone',
         address: await this.getResellerAddress(),
         delivery: await UserStorage.getMemberInfo('customerProfile').then(res => res.regionDelivery)
      }

      return cardInfo
   }

   /**
    * Retorna o endereço formatado da revenda
    * @returns {Promise<string>} O nome do endereço da Revenda
    */
   async getResellerAddress() {
      const resellerAddress = await UserStorage.getMemberInfo('address') ?? []
      const addressToUse = resellerAddress[0]

      if (!addressToUse) return 'Sem endereço disponível'

      return [
         addressToUse.street,
         addressToUse.number,
         addressToUse.district,
         addressToUse.city,
         addressToUse.stateProvince
      ].join(', ')
   }

   /**
    * Cria as informações do card da revenda
    * @param {object} resellerInfo As informações da revenda 
    * @returns {JQuery[]} Os elementos do array
    */
   createResellerInfo(resellerInfo) {
      const left = new Div('SP__salepdf__people__reseller__left')
      const middle = new Div('SP__salepdf__people__reseller__middle')
      const right = new Div('SP__salepdf__people__reseller__right')
      const name = new Div('SP__salepdf__people__reseller__left__name')
      const role = new Div('SP__salepdf__people__reseller__left__role')
      const address = new Div('SP__salepdf__people__reseller__right__address')
      const delivery = new Div('SP__salepdf__people__reseller__right__delivery')
      const info = this.createCardInfo(resellerInfo).slice(1)

      delivery.text(resellerInfo.delivery)
      address.text(resellerInfo.address)
      name.text(resellerInfo.name)
      role.text('Loja')
      left.append(name, role)
      middle.append(info)
      right.append(address, delivery)

      return [
         left,
         middle,
         right
      ]
   }

   /**
    * Cria um cartão para ser adicionado no PDF
    * @param {object} info As informações do cartão 
    * @returns {Promise<JQuery>} O elemento
    */
   createCardInfo(info) {
      const name = new Div('SP__salepdf__people__card__title')
      const role = new Div('SP__salepdf__people__card__title__role')
      const contact = new Div('SP__salepdf__people__card__contact')
      const phone = new Div('SP__salepdf__people__card__info')
      const email = new Div('SP__salepdf__people__card__info')
      const document = new Div('SP__salepdf__people__card__info')

      role.text(info.role)
      name.text(info.name)
      phone.text(info.phone)
      email.text(info.email)
      document.text(info.document)
      name.append(role)

      phone.prepend(new Icon('ic-phone'))
      email.prepend(new Icon('ic-email'))
      document.prepend(new Icon('ic-document'))

      if (info.phone) {
         contact.append(phone)
      }
      if (info.document) {
         contact.append(document)
      }
      if (info.email) {
         contact.append(email)
      }

      return [
         name,
         contact
      ]
   }

   /**
    * Cria a seção de items dos carrinhos
    * @returns {Promise<JQuery>} O elemento da seção 
    */
   async createPDFCart() {
      const wrapper = new Div('SP__salepdf__products')
      const products = this.products.map((product, index) => this.createProductCard(product, index))

      wrapper.append(products)

      return wrapper
   }

   /**
    * Cria o item de um carrinho
    * @param {object} product O produto
    * @returns {JQuery} O elemento 
    */
   createProductCard(product, index) {

      const wrapper = new Div('SP__salepdf__products__product')
      const header = new Div('SP__salepdf__products__product__header')
      const info = new Div('SP__salepdf__products__product__header__info')
      const image = new Img('SP__salepdf__products__product__header__image')
      const title = new Div('SP__salepdf__products__product__header__info__title')
      const number = new Div('SP__salepdf__products__product__header__info__index')
      const price = new Div('SP__salepdf__products__product__header__price')
      const body = new Div('SP__salepdf__products__product__body')
      const left = new Div('SP__salepdf__products__product__body__left')
      const right = new Div('SP__salepdf__products__product__body__right')
      const measures = this.createProductMeasures(product)
      const assembly = this.createProductAssemblyInfo(product)
      const descriptions = this.createProductDescriptions(product)
      const warranty = this.createProductWarranty(product)
      const delivery = this.createProductDelivery(product)

      title.text(product.product.title)
      image.attr('src', STORAGE_URL + product.product.image)
      price.text(CURRENCY + ' ' + product.extract[this.showMarkup ? 'markuped' : 'total'])
      number.text(`# ${index + 1}`)

      wrapper.append(
         header,
         body
      )

      header.append(
         image,
         info,
         price,
      )

      body.append(
         left,
         right
      )

      left.append(
         measures,
         delivery,
         warranty
      )

      right.append(
         assembly
      )

      info.append(
         number,
         title,
         ...descriptions
      )

      return wrapper
   }

   /**
    * Cria as informações de garantia
    * @param {object} product O produto
    * @returns {JQuery} O elemento com as informações 
    */
   createProductWarranty(product) {
      const wrapper = new Div('SP__salepdf__products__product__body__warranty')
      const title = new Div('SP__salepdf__products__product__body__warranty__title')
      const description = new Div('SP__salepdf__products__product__body__warranty__description')

      title.text('Garantia')
      description.text(Math.floor(Number(product.warranty.days) / 365) + ' anos')
      wrapper.append(title, description)

      return wrapper
   }

   /**
    * Cria as informações de garantia
    * @param {object} product O produto
    * @returns {JQuery} O elemento com as informações 
    */
   createProductDelivery(product) {
      const wrapper = new Div('SP__salepdf__products__product__body__delivery')
      const title = new Div('SP__salepdf__products__product__body__delivery__title')
      const description = new Div('SP__salepdf__products__product__body__delivery__description')

      title.text('Previsão de Entrega')
      description.text(product.daysToDeliver + ' dias')
      wrapper.append(title, description)

      return wrapper
   }

   /**
    * Cria as descrições de um produto
    * @param {object} product O produto
    * @returns {JQuery[]} Os elementos
    */
   createProductDescriptions(product) {
      const wrapper = new Div('SP__salepdf__products__product__header__info__desc')
      const allItems = this.getProductDescData(product).map(desc => this.createProductDescription(desc))

      wrapper.append(allItems)

      return wrapper
   }

   /**
    * Retorna as descrições do produto
    * @param {object} product O produto 
    * @returns {object[]} Os dados da descrição
    */
   getProductDescData(product) {
      return [
         {
            title: 'Modelo',
            value: product?.model?.title ?? 'Sem modelo'
         },
         {
            title: 'Linha',
            value: product?.line?.title ?? 'Sem linha'
         },
         {
            title: 'Classificação',
            value: product?.classification?.title ?? 'Sem classificação'
         },
         {
            title: 'Ambiente',
            value: product?.environment?.title ?? 'Sem ambiente'
         }
      ]
   }

   /**
    * Cria uma descrição de um dado do produto
    * @param {object} description A configuração da descrição
    * @returns {JQuery} O elemento da descrição 
    */
   createProductDescription(description) {
      const desc = new Div('SP__salepdf__products__product__header__info__desc__item')
      const title = new Div('SP__salepdf__products__product__header__info__desc__item__title')
      const value = new Div('SP__salepdf__products__product__header__info__desc__item__value')

      title.text(description.title)
      value.text(description.value)
      desc.append(title, value)

      return desc
   }

   /**
    * Cria a seção de medidas do produto
    * @param {object} product O produto
    * @returns {JQuery} A seção de meidas
    */
   createProductMeasures(product) {
      const dataCart = new DataCart(product)
      const wrapper = new Div('SP__salepdf__products__product__body__measures')
      const title = new Div('SP__salepdf__products__product__body__measures__title')
      const measures = this.getProductMeasuresData(product).map(measure => this.createProductMeasure(measure))
      const total = this.createProductMeasure({
         piece: 'Total',
         width: dataCart.getTotalWidth(),
         height: dataCart.getTotalHeight(),
         area: dataCart.getTotalArea(),
      })

      title.text('Medidas')
      wrapper.append(title, ...measures)

      if (measures.length > 1) {
         wrapper.append(total)
      }

      return wrapper
   }

   /**
    * Retorna as medidas do produto
    * @param {object} product O produto
    * @returns {object[]} As medidas
    */
   getProductMeasuresData(product) {
      return (product.measures ?? []).map(({ width, height, area }, index) => ({
         piece: 'Peça ' + Utils.alphabet(true)[index],
         width,
         height,
         area
      }))
   }

   /**
    * Cria a visualização de uma medida
    * @param {object} measure Um objeto de uma medida
    * @returns {JQuery} O elemento da medida
    */
   createProductMeasure(measure) {
      const wrapper = new Div('SP__salepdf__products__product__body__measures__item')
      const piece = new Div('SP__salepdf__products__product__body__measures__item__piece')
      const size = new Div('SP__salepdf__products__product__body__measures__item__size')

      piece.text(measure.piece)
      size.text(`${measure.width}m x ${measure.height}m = ${measure.area}m²`)
      wrapper.append(piece, size)

      return wrapper
   }

   /**
    * Cria a seção de montagem dos produtos
    * @param {object} product O produto
    * @returns {JQuery} O elemento da seção
    */
   createProductAssemblyInfo(product) {
      const wrapper = new Div('SP__salepdf__products__product__body__assembly')
      const groups = this.getGroupsAssemblyInfo(product).map(group => this.createGroupAssemblyInfo(group))
      
      wrapper.append(...groups)

      return wrapper
   }

   /**
    * Retorna as informações de cada grupo para mostrar no layout
    * @param {object} product O produto em si
    * @returns {object[]} As informações de cada grupo
    */
   getGroupsAssemblyInfo(product) {
      const groups = []

      product.compositions.forEach(composition => {
         const group = groups.find(group => group.id === composition.groupID)
         const isAdded = Boolean(group)         
         const item = {
            option: composition.view.description,
            value: composition.view.title,
            sublabel: this.getFormValueAsText(composition)
         }

         if(!isAdded){
            groups.push({
               id: composition.groupID,
               name: composition.view.groupName,
               items: [item]
            })
            return
         }

         group.items.push(item)
      })

      return groups
   }

   /**
    * Retorna os valores dos formulários internos
    * @param {object} composition A composição a ser retornada 
    * @returns {string} As informações do formulário
    */
   getFormValueAsText(composition) {
      const forms = composition.form ?? []
      const hasForm = forms.length

      if (!hasForm) return ''

      const formValues = forms.map(form => {
         const value = form.value
         const isObject = typeof value === 'object'

         if (isObject) {
            return `(${value.hex}|${value.pan})`
         }

         return value
      }).join(', ')

      return formValues
   }

   /**
    * Cria a informação de montagem de um grupo
    * @param {object} group A configuração de um grupo
    * @returns {JQuery} O elemento do grupo
    */
   createGroupAssemblyInfo({ name, items }) {
      const wrapper = new Div('SP__salepdf__products__product__body__assembly__group')
      const title = new Div('SP__salepdf__products__product__body__assembly__group__title')
      const options = items.map(item => this.createGroupOptionItem(item))

      title.text(name)
      wrapper.append(title, ...options)

      return wrapper
   }

   /**
    * Cria a informação de uma opção da montagem
    * @param {object} option A opção em si
    * @returns {JQuery} O elemento JQuery
    */
   createGroupOptionItem({ option, value, sublabel }) {
      const wrapper = new Div('SP__salepdf__products__product__body__assembly__group__option')
      const label = new Div('SP__salepdf__products__product__body__assembly__group__option__label')
      const selected = new Div('SP__salepdf__products__product__body__assembly__group__option__selected')
      const subinfo = new Div('SP__salepdf__products__product__body__assembly__group__option__selected__sublabel')

      selected.text(value)
      label.text(option)
      subinfo.text(sublabel)
      wrapper.append(label, selected)

      if (sublabel) {
         selected.append(subinfo)
      }

      return wrapper
   }

   /**
    * Cria o sumário do PDF
    * @returns {JQuery} A visualização do sumário
    */
   async createPDFSummary() {
      const summary = new Div('SP__salepdf__summary')
      const header = new Header('SP__salepdf__summary__header')
      const body = new Div('SP__salepdf__summary__body')
      const items = this.getSummaryItems().map(item => this.createSummaryItem(item))

      header.append(new Div().text('Referente'), new Div().text(`Custo (${CURRENCY})`))
      summary.append(header, body)
      body.append(items)

      return summary
   }

   /**
    * Retorna os items do sumário
    * @returns {object[]} Os items do sumário
    */
   getSummaryItems() {
      return [
         {
            name: 'Produtos',
            value: Utils.formatCurrency(this.getProductsTotal(this.showMarkup ? 'markuped' : 'total')),
            signal: '+'
         },
         {
            name: 'Adicionais',
            value: Utils.formatCurrency(this.getProductsTotal('additional')),
            signal: '+'
         },
         {
            name: 'Descontos',
            value: Utils.formatCurrency(this.getProductsTotal('discount')),
            signal: '-'
         },
         {
            name: 'Total',
            value: Utils.formatCurrency(this.getProductsTotal(this.showMarkup ? 'markuped' : 'total')),
            signal: CURRENCY
         }
      ]
   }

   /**
    * Retorna o total de um produto baseado em uma chave do `extract`
    * @param {string} key A chave que será usada 
    * @returns {number} O total somado de todos os produtos
    */
   getProductsTotal(key) {
      return this.products.reduce((total, product) => {
         return total + (Number(product.extract[key] ?? 0))
      }, 0)
   }

   /**
    * Cria um item do sumário
    * @param {object} item O item do sumário 
    * @returns {JQuery} A linha do sumário
    */
   createSummaryItem({ name, value, signal }) {
      const row = new Div('SP__salepdf__summary__body__row')
      const title = new Div('SP__salepdf__summary__body__row__title')
      const total = new Div('SP__salepdf__summary__body__row__total')

      title.text(name)
      total.text(signal + ' ' + value)
      row.append(title, total)

      if (value > 0) {
         total.css('color', 'var(--green)')
      }

      return row
   }
}