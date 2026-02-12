
fetch('./assets/icons.svg')
   .then(res => res.text())
   .then(res => document.body.insertAdjacentHTML('beforebegin', res))
