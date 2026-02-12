export function getFormatedTodayDate() {
      return new Date()
         .toLocaleDateString()
         .split('/')
         .reverse()
         .join('-')
}

export function getCurrentYear(){
    return new Date().getFullYear()
}
