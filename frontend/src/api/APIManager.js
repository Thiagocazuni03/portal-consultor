import UserStorage from "../core/UserStorage.js"
import { APPLICATION, AUTH_URL, CATALOG_URL, REPO_URL, API_KEY, PARTNER_URL, PRICING_URL, MARKUP_JSON_URL } from "./Variables.js"

export default class APIManager {

   static async getPartners() {
      return this.doAPIRequest(PARTNER_URL, {
         "application": APPLICATION,
         "type": "list",
         "data": { "member": await UserStorage.getMemberInfo("id") }
      }).then(res => (res.itens ?? []))
   }

   static async getAuth() {
      return this.doAPIRequest(AUTH_URL, {
         application: APPLICATION,
         idSeller: await UserStorage.getSellerInfo('identifier'),
         idMember: await UserStorage.getMemberInfo('identifier')
      })
   }

   static async getUserMarkup(productID) {
      return this.doAPIRequest(PRICING_URL, {
         type: 'list',
         application: APPLICATION,
         member: await UserStorage.getMemberInfo('id'),
         id: productID,
      }).then(res => res?.itens?.[0])
   }

   static async doAPIRequest(url, params) {
      // console.trace("Executando");
      // console.log(url)
      // console.log({ "key": API_KEY, "params": params })
        
      // fetch(url, {
      //    method: "POST",
      //    headers: { "Content-Type": "application/x-www-form-urlencoded" },
      //    body: new URLSearchParams({
      //       "key": API_KEY,
      //       "params": JSON.stringify(params)
      //    }),
      //    cache: "no-store"
      // })
      //    .then(res => res.text()) // ou res.json() se a resposta for JSON
      //    .then(data => {
      //       console.log("Resposta da API:", data)
      //    })
      //    .catch(error => {
      //       console.error("Erro ao fazer o fetch:", error)
      //    })

      return fetch(url, {

         method: "POST",
         headers: { "Content-Type": "application/x-www-form-urlencoded" },
         body: new URLSearchParams({ "key": API_KEY, "params": JSON.stringify(params) }),
         cache: "no-store"

      }).then(res => res.json())
   }

   static async getProducts() {
      return this.fetchJSON(CATALOG_URL + `?t=${new Date().getTime()}`).then(res => (res.product ?? []))
   }

   static async getRepository(key) {
      return this.fetchJSON(REPO_URL + `?t=${new Date().getTime()}`).then(res => key ? res[key] : res)
   }

   static async getMarkup(id) {
      return this.fetchJSON(MARKUP_JSON_URL + id + '.json?t=' + crypto.randomUUID())
   }

   static async fetchJSON(url, options) {
      return fetch(url, { cache: 'no-store', ...options }).then(res => res.json())
   }
 
}