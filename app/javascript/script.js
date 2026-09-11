import { manaify } from "mana"

const scryURL = "https://api.scryfall.com/cards/"
const dbURL = "http://localhost:4000/cardCollection/"

const getByID = (id) => document.getElementById(id)
const createEle = (tag) => document.createElement(tag)

const searchForm = getByID("searchForm")
const resultsUL = getByID("search-results")
const searchImg = getByID("search-card-img")
const addForm = getByID("addForm")
const updateForm = getByID("updateForm")
const deleteBtn = getByID("deleteBtn")
const randBtn = getByID("randSearch")
const searchFlip = getByID("search-flip-btn")
const collectionFlip = getByID("collection-flip-btn")
const textInputs = [...document.getElementsByClassName("textInput")]

searchForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const formData = Object.fromEntries(new FormData(searchForm))
  getCards(formData.query)
  addForm.reset()
})

addForm.addEventListener("submit", (e) => {
  e.preventDefault()
  if (!searchImg.dataset.name) {
    alert("Use the search to find a card to add!")
    return
  }

  const formData = Object.fromEntries(new FormData(addForm))
  const card = {
    comment: formData.comment || "",
    print: "foil" in formData,
    artSize: "art" in formData,
    cardCondition: formData.condition,
    ...searchImg.dataset,
  }

  postCard(card)
  addForm.reset()
})

randBtn.addEventListener("click", (e) => {
  e.target.disabled = true
  searchForm.reset()
  addForm.reset()
  fetch(scryURL + "random")
    .then((res) => res.json())
    .then((data) => {
      resultsUL.replaceChildren()
      appendSearch(data, 0)
      displayCardInfo(resultsUL.children[0], "search")
    })
    .catch(err => {
      alert("API Failed, try again.")
      console.log(err)
    })
    .finally(() => {
      e.target.disabled = false
    })
})

document.body.addEventListener("keydown", (e) => {
  if (!textInputs.includes(document.activeElement)) {
    switch (e.key) {
      case "ArrowUp":
        cycleResults(-1)
        break
      case "ArrowDown":
        cycleResults(1)
        break
    }
  }
})

function cycleResults(direction) {
  if (resultsUL.childElementCount > 0 && searchImg.dataset.cardId) {
    let id = +searchImg.dataset.cardId.slice(6) + direction
    if (id >= 0 && id < resultsUL.childElementCount) {
      id = "result" + id
      displayCardInfo(getByID(id), "search")
    }
  } else if (resultsUL.childElementCount > 0 && !searchImg.dataset.cardId) {
    displayCardInfo(getByID("result0"), "search")
  }
}

function getCards(query) {
  fetch(`${scryURL}search?q=${query.replace(/ /g, "+")}`)
    .then((res) => res.json())
    .then((queryRes) => {
      if (queryRes.status === 404) {
        alert(queryRes.details)
      } else {
        const cards = queryRes.data
        resultsUL.replaceChildren()
        cards.slice(0, 10).forEach((card, i) => {
          appendSearch(card, i)
        })
      }
    })
}

function appendSearch(card, id) {
  const front = card.card_faces?.[0] ?? {}
  const back = card.card_faces?.[1] ?? {}

  const pick = (key) => card[key] ?? front[key]

  const rawOracle =
    card.oracle_text ??
    [front.oracle_text, back.oracle_text].filter(Boolean).join("\n// ")

  const cardLi = createEle("li")
  let oracleText = (rawOracle ?? "").replace(/\n/g, ", ").replace(/\.,/g, ".")

  let attributes = {
    "data-name": card.name,
    "data-imgurl": (card.image_uris ?? front.image_uris).normal ?? "",
    "data-backimgurl": (card.image_uris ?? back.image_uris).normal ?? "",
    "data-set": card.set_name,
    "data-artist": pick("artist"),
    "data-flavor-text": pick("flavor_text") ?? "",
    "data-oracle-text": oracleText,
    "data-type-line": pick("type_line"),
  }

  if (card.flavor_name && card.flavor_name !== card.name) {
    cardLi.textContent = card.flavor_name
    oracleText = oracleText.replaceAll(card.name, card.flavor_name)
    attributes["data-flavor-name"] = card.flavor_name

    Object.entries(attributes).forEach(([tag, value]) => {
      cardLi.setAttribute(tag, value)
    })
  } else {
    cardLi.textContent = card.name
    attributes["data-flavor-name"] = ""
    Object.entries(attributes).forEach(([tag, value]) => {
      cardLi.setAttribute(tag, value)
    })
  }

  cardLi.id = "result" + id
  cardLi.addEventListener("click", (e) => {
    displayCardInfo(e.target, "search")
    addForm.reset()
  })
  resultsUL.appendChild(cardLi)
}

function displayCardInfo(cardLi, mode) {
  const card = { ...cardLi.dataset }
  const pArr = []

  if(card.imgurl == card.backimgurl) {
    if(mode == 'search') { searchFlip.hidden = true }
    if(mode == 'collection') { collectionFlip.hidden = true }
  } else {
    if(mode == 'search') { searchFlip.hidden = false }
    if(mode == 'collection') { collectionFlip.hidden = false }
  }

  if (mode == "search") {
    pArr.push(...getByID("search-info-container").querySelectorAll("p"))
    searchImg.src = card.imgurl
    searchImg.setAttribute("data-card-id", cardLi.id)

    if (card.flavorName) {
      getByID("search-card-name").textContent =
        `${card.flavorName} (${card.name})`
    } else {
      getByID("search-card-name").textContent = card.name
    }

    for (const key in cardLi.dataset) {
      searchImg.dataset[key] = cardLi.dataset[key]
    }
  }

  pArr[0].textContent = card.typeLine
  pArr[1].textContent = card.artist
  pArr[2].textContent = card.set
  pArr[3].innerHTML = manaify(card.oracleText)
  pArr[4].textContent = card.flavorText

  for (const p of pArr) {
    if (p.textContent == "undefined" || p.textContent == "") {
      p.textContent = "None."
    }
  }
}

function postCard(cardObj) {
  fetch(dbURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cardObj),
  })
    .then((res) => res.json())
    .then((data) => {
      cardObj.id = data.id
      document.dispatchEvent(new CustomEvent("collection:add", { detail: cardObj }))
    })
    .catch(err => {
      alert("Could not add card, try again.")
    })
}

function patchCard(updates, cardId) {
  fetch(dbURL + cardId, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data)
    })
}

function deleteCard(cardId) {
  fetch(dbURL + cardId, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data)
    })
}