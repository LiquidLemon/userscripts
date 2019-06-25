// ==UserScript==
// @name     MojaPGmean
// @description Oblicza średnią częściową i z niezatwierdzonych ocen na MojaPG
// @version  1.2
// @author   Michał Jakubowicz
// @grant    none
// @include  *://moja.pg.edu.pl/auth/app/student*
// ==/UserScript==

const TABLE_SELECTOR = '.rich-table'
const GRADE_COLUMN = 2
const WEIGHT_COLUMN = 5

const weightedMean = (items) => {
  if (items.length === 0) {
    return null
  }
  let totalWeight = 0
  let totalSum = 0
  // can't use Array.prototype.reduce because it's overridden by the website
  items.forEach(({ grade, weight }) => {
    totalWeight += weight
    totalSum += grade * weight
  })
  return totalSum / totalWeight
}

const process = async () => {
  const [table] = document.getElementsByClassName('rich-table')
  // ignore when called without the table existing or if there already is a mean calculated
  if (!table || !table.tFoot.rows[0].cells[GRADE_COLUMN].innerText.includes('0,000')) {
    return;
  }

  const rows = Array.from(table.tBodies[0].rows)
  const courses = rows.map(row => ({
    grade: Number.parseFloat(row.cells[GRADE_COLUMN].innerText),
    weight: Number.parseInt(row.cells[WEIGHT_COLUMN].innerText)
  }))

  const graded = courses.filter(({ grade }) => grade) // drop NaN values
  const textNode = table.tFoot.rows[0].cells[GRADE_COLUMN].childNodes[1]
  const mean = weightedMean(graded);
  if (!mean) {
    return
  }

  textNode.nodeValue = ' ' + mean.toFixed(3).replace('.', ',')
}

window.addEventListener('load', process)

const observer = new MutationObserver(mutations => {
  const m = mutations
    .filter(
      mutation => mutation.target.nodeType === Node.ELEMENT_NODE && // ignore text changes
      !mutation.target.className.includes('counter') && // ignore counter changes (every second or so)
      mutation.addedNodes.length > 0
    )
    .map(mutation => mutation.addedNodes[0])
    .filter(node => node.querySelector('.rich-table') !== null)

  if (m.length > 0) {
    // some parts of the DOM are hidden when using the mutation object so the
    // processing is independent of the handler
    process()
  }
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
})
