import APIManager from '../api/APIManager.js'
import { STORAGE_URL, EVENT_URL, APPLICATION, API_KEY } from '../api/Variables.js'

export default class FolderManager{
   constructor(path, folder){
      this.path = path
      this.folder = folder
   }

   async create(fileName, content, extension = 'json'){
      return await this.#doAction('CREATE', fileName, content, extension)
   }

   async delete(fileName){
      return await this.#doAction('DELETE', fileName)
   }

   async update(fileName, content, extension = 'json'){
      console.log('UPDATE');
      
      return await this.#doAction('CREATE', fileName, content, extension)
   }

   getPath(){
      return this.path
   }

   async uploadByURL(fileName, base64, extension){
      const uploadURL = await this.#doAction('GET_UPLOAD_URL', fileName, extension).then(res => res.body.responseGenerate)
      const imageMime = this.getExtensionMimeType(extension)
      const base64Blob = this.turnBase64IntoBlob(base64, imageMime)

      await fetch(uploadURL, {
         //Realizando o upload
         method: 'POST',
         mode: 'no-cors',
         headers: {
            'Content-Type': 'image/' + extension,
            'X-Access-Control-Allow-Origin': '',
            'Access-Control-Allow-Origin': ''
        },
        body: base64Blob
      })

      return `${STORAGE_URL}${this.path}/${this.folder}/${fileName}.${extension}`
   }

   async list(){
      const response = await this.#doAction('LIST')
      const allItems = (response.body ?? [])
      const allFiles = allItems.map(({ name, date }) => this.getFileNameFromPath(name))

      return allFiles
   }

   async read(fileName, extension = 'json'){
      return APIManager.fetchJSON(`${STORAGE_URL}${this.path}/${this.folder}/${fileName}.${extension}?t=${new Date().getTime()}`)
   }

   async readAll(){
      const allFiles = await this.list()
      const readRequests = await Promise.all(allFiles.map(name => this.read(name)))

      return readRequests
   }

   async deleteAll(){
      const allFiles = await this.list()
      const deleteRequests = await Promise.all(allFiles.map(name => this.delete(name)))

      return deleteRequests
   }

   getFileNameFromPath(filePath){
      return filePath
         .split('/')
         .pop()
         .split('.')
         [0]
   }

   turnBase64IntoBlob(base64, mimeType) {
      const byteCharacters = window.atob(base64)
      const byteNumbers = new Array(byteCharacters.length)

      for (let i = 0; i < byteCharacters.length; i++) {
         byteNumbers[i] = byteCharacters.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      const blobData = new Blob([byteArray], { type: mimeType })

      return blobData
   }

   getExtensionMimeType(extension){
      return{
         'jpe': 'image/jpeg',
         'jpeg': 'image/jpeg',
         'jpg': 'image/jpeg',
         'png': 'image/png',
         'svg': 'image/svg+xml',
         'svgz': 'image/svg+xml',
         'webp': 'image/webp'
      }[extension]
   }

   async #doAction(action, ...params) {
      // console.trace(EVENT_URL);
      // console.log(this.#getParams(action, ...params));
      // debugger
      return await APIManager.fetchJSON(EVENT_URL, this.#getParams(action, ...params))
   }

   #getParams(action, ...params) {
      return {

         'CREATE': () => this.#getParamsToCreate(...params),
         'DELETE': () => this.#getParamsToDelete(...params),
         'LIST': () => this.#getParamsToList(...params),
         'GET_UPLOAD_URL': () => this.#getParamsToGenerateURL(...params)

      }[action]()
   }

   #getParamsToGenerateURL(fileName, extension){
      return this.#createFetchOptions({
         application: APPLICATION,
         key: API_KEY,
         path: `${this.path}/${this.folder}/`,
         fileName: fileName,
         extension: extension,
         request: 'generateURL',
         type: 'file'
     })
   }

   #getParamsToCreate(fileName, content, extension) {
      return this.#createFetchOptions({
         application: APPLICATION,
         key: API_KEY,
         path: `${this.path}/${this.folder}/`,
         fileName: fileName,
         content: content,
         extension: extension,
         type: 'file',
      })
   }

   #getParamsToDelete(fileName){
      return this.#createFetchOptions({
         application: APPLICATION,
         key: API_KEY,
         path: `${this.path}/${this.folder}/`,
         fileName: fileName,
         extension: 'json',
         type: 'file',
         request: 'delete',
     })
   }

   #getParamsToList(){
      return this.#createFetchOptions({
         application: APPLICATION,
         key: API_KEY,
         path: `${this.path}/${this.folder}`,
         type: 'file',
         request: 'list',
      })
   }

   #createFetchOptions(content){
      return {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(content)
      }
   }
}


