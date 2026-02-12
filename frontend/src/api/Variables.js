function getVarPath(){
   const possiblePaths = [/* S */'U3VubHV4',/* A */'QW1vcmlt']
   const pathBasedOnURL = possiblePaths.find(name => location.hostname.includes(atob(name).toLowerCase()))
   const pathOnLocalHost = 'QW1vcmlt'
   const isUserOnLocalHost = location.hostname.includes('localhost')
   
   if(pathBasedOnURL){
      return atob(pathBasedOnURL)
   }
   if(isUserOnLocalHost){
      return atob(pathOnLocalHost)
   }

   throw new Error('Verificar váriaveis globais')
}



const varPath = getVarPath()

const { default: VARS } = await import(`./variables/${varPath}.js`)

//Chaves que mudam
export const CODE = VARS.CODE
export const APPLICATION = VARS.APPLICATION
export const BRAND = VARS.BRAND
export const STORAGE_URL = VARS.STORAGE_URL
export const TERMS = VARS.TERMS
export const FAVICON = VARS.FAVICON
export const CURRENCY = VARS.CURRENCY
export const HIDDEN_PRODUCTS = VARS.HIDDEN_PRODUCTS

//Chave API
export const API_KEY = 'qw56ew4hbn4k8j91d331xd3b1nj89re98w'

//Links Storage
export const REPO_URL = STORAGE_URL + `portal/repository.json?t=${new Date().getTime()}`
export const MARKUP_JSON_URL = STORAGE_URL + 'portal/markup/'
export const CATALOG_URL = STORAGE_URL + `portal/product/catalog.json?t=${new Date().getTime()}`

//Links API's 
// deploy

export const API_BASE_URL = 'https://workspace.allinsys.com/api/app/curtain/'
// export const API_BASE_URL2 = 'http://localhost:3000/'  
export const API_BASE_URL2 = 'https://portal-613577280271.us-east1.run.app/'
          
// local           

// export const API_BASE_URL = 'http://localhost/allinsys/api/app/curtain/'
    
export const EVENT_URL = 'https://us-east1-prj-infra-allinsys.cloudfunctions.net/triggers-1'
 
export const PARTNER_URL = API_BASE_URL + 'partners'
export const SERVICES_URL = API_BASE_URL + 'services'
export const PRICING_URL = API_BASE_URL2 + 'pricing'
export const LOGIN_URL = API_BASE_URL + 'login'
export const AUTH_URL = API_BASE_URL + 'check-authentication'
//old fernando 
// export const ORDER_DRAFT_SEARCH_URL = API_BASE_URL + 'order-search'
// Thiago Cazuni 
export const DRAFTS_FOLDER_PATH = 'file/draft' 
export const ORDER_FOLDER_PATH = 'file/order' 
// export const ORDER_DRAFT_SEARCH_URL = API_BASE_URL2 + 'draft/order-search'
export const ORDER_DRAFT_SEARCH_URL = API_BASE_URL2 + 'search'
// Thiago Cazuni
// export const ORDER_DRAFT_SEARCH_URL = API_BASE_URL + 'order-search'
export const DRAFT_VIEW = API_BASE_URL + 'draft-view'
export const ORDER_URL = API_BASE_URL + 'order'
export const BUYER_URL = API_BASE_URL + 'buyer'
//Outras váriaveis
export const ORDER_DATA_FILE_NAME = 'order'
// export const DRAFTS_FOLDER_PATH = 'file/order'
export const TEMPLATES_PATH_URL = '/assets/html/'
export const IS_DEVELOPER = window.location.hostname === 'localhost'
export const LOGS_CART_PASSWORD = BRAND

// function getVarPath(){ 
//    const possiblePaths = [/* S */'U3VubHV4',/* A */'QW1vcmlt']
//    const pathBasedOnURL = possiblePaths.find(name => location.hostname.includes(atob(name).toLowerCase()))
//    const pathOnLocalHost = 'QW1vcmlt'
//    const isUserOnLocalHost = location.hostname.includes('localhost')
   
//    if(pathBasedOnURL){
//       return atob(pathBasedOnURL)
//    }
//    if(isUserOnLocalHost){
//       return atob(pathOnLocalHost)
//    }

//    throw new Error('Verificar váriaveis globais')
// }



// const varPath = getVarPath()

// const { default: VARS } = await import(`./variables/${varPath}.js`)

// //Chaves que mudam
// export const CODE = VARS.CODE
// export const APPLICATION = VARS.APPLICATION
// export const BRAND = VARS.BRAND
// export const STORAGE_URL = VARS.STORAGE_URL
// export const TERMS = VARS.TERMS
// export const FAVICON = VARS.FAVICON
// export const CURRENCY = VARS.CURRENCY
// export const HIDDEN_PRODUCTS = VARS.HIDDEN_PRODUCTS

// //Chave API
// export const API_KEY = 'qw56ew4hbn4k8j91d331xd3b1nj89re98w'

// //Links Storage
// export const REPO_URL = STORAGE_URL + `portal/repository.json?t=${new Date().getTime()}`
// export const MARKUP_JSON_URL = STORAGE_URL + 'portal/markup/'
// export const CATALOG_URL = STORAGE_URL + `portal/product/catalog.json?t=${new Date().getTime()}`

// //Links API's
// export const API_BASE_URL = 'https://url-cloud-run/api/app/curtain/'
// export const EVENT_URL = 'https://us-east1-prj-infra-allinsys.cloudfunctions.net/triggers'

// export const PARTNER_URL = API_BASE_URL + 'partners'
// export const SERVICES_URL = API_BASE_URL + 'services'
// export const PRICING_URL = API_BASE_URL + 'pricing'
// export const LOGIN_URL = API_BASE_URL + 'login'

// export const AUTH_URL = API_BASE_URL + 'check-authentication'
// export const ORDER_DRAFT_SEARCH_URL = API_BASE_URL + 'order-search'
// export const DRAFT_VIEW = API_BASE_URL + 'draft-view'
// export const ORDER_URL = API_BASE_URL + 'order'
// export const BUYER_URL = API_BASE_URL + 'buyer'

// //Outras váriaveis
// export const ORDER_DATA_FILE_NAME = 'order'
// export const DRAFTS_FOLDER_PATH = 'file/order'
// export const TEMPLATES_PATH_URL = '/assets/html/'
// export const IS_DEVELOPER = window.location.hostname === 'localhost'
// export const LOGS_CART_PASSWORD = BRAND