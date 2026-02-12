import Session from './Session.js'
import UserStorage from './UserStorage.js'
import AcceptTermsTab from '../business/terms/AcceptTermsTab.js'
import BlockedModal from '../business/general/BlockedModal.js'
import APIManager from '../api/APIManager.js'
import { FAVICON } from '../api/Variables.js'
import $ from 'jquery'
import Translator from '../translation/Translator.js'

/**
 * @author Fernando Petri
 * Classe que faz verificações e inicialize as classes das páginas
 */
export default class Initializer {

   static #USER_AUTH = null
   static #SKIP_ALL = false   

   static async initialize(callback) {
      if(Initializer.#SKIP_ALL) return callback()

      Initializer.#handleSession()
      Initializer.#handleDraftSession()
      Initializer.#setFavicon()
      
      await Initializer.#initTranslator()
      await Initializer.#handleStorage()
      await Initializer.#handleAuth()
      await Initializer.#handleTerms()

      callback()
   }

   static async #initTranslator(){
      await Translator.initialize()
   }

   static #handleSession(){
      Session.setDefaultSettings()
   }

   static #setFavicon(){
      if(!FAVICON) return

      const link = $('<link>')

      link.attr('rel', 'shortcut icon')
      link.attr('href', 'data:image/svg+xml,' + FAVICON.replaceAll('#', '%23'))

      $('head').append(link)
   }

   static async #handleStorage(){
      if(UserStorage.isSessionOkay()){
         await UserStorage.initSession()
      } else {
         new BlockedModal({
            icon: 'ic-close',
            title: 'Problema na sessão',
            message: 'Encontramos um problema na sua sessão, você terá que logar novamente.',
            buttons: [{ type: 'filled', text: 'Entendi', color: 'var(--red)', onClick: () => location.href = '/index.html' }]
         }).openModal()

         Initializer.#throw('Há um problema na seção.')
      }
   }

   static #handleDraftSession(){
      const currentPage = location.pathname.slice(1).split('.')[0]
      const shouldDeleteSession = !['catalog', 'success'].includes(currentPage)
      const configToDelete = [
         'currentDraftID', 
         'currentProductToken', 
         'currentDraftIndex', 
         'productToAutoOpenEdit'
      ]

      if(shouldDeleteSession){
         configToDelete.forEach(key => {
            Session.delete(key)
         })
      }
   }

   static async #handleAuth(){
      const userAuth = (Initializer.#USER_AUTH ?? await APIManager.getAuth())
      console.log(userAuth);
      
      const isSellerBlocked = !!Number(userAuth.blockedSeller)
      const isFinanceBlocked = !!Number(userAuth.blockedFinance)

      Initializer.#USER_AUTH = userAuth

      if(isSellerBlocked){
         new BlockedModal().openModal()
         Initializer.#throw('O usuário está bloqueado')
      }
      if(isFinanceBlocked){
         Session.set('isFinanceBlocked', true)
      }
   }

   static async #handleTerms(){
      const userTermsDate = await UserStorage.getSellerInfo('terms')
      const isTermsAccepted = userTermsDate.split(' ').length === 2 && userTermsDate !== '0000-00-00 00:00:00'

      if(!isTermsAccepted){
         new AcceptTermsTab({ callback: Initializer.initialize }).open()
         Initializer.#throw('O usuário não aceitou os termos')
      }
   }

   static #throw(message){
      throw new Error(message)
   }
}