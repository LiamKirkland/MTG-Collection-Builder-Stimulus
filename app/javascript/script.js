const scryURL = "https://api.scryfall.com/cards/"
const dbURL = "http://localhost:4000/cardCollection/"

const getByID = (id) => document.getElementById(id)
const createEle = (tag) => document.createElement(tag)
const collImgIndex = () =>
  Array.from(collContainer.children).indexOf(
    collContainer.querySelector(`[data-id='${collImg.dataset.cardId}']`),
  )

const searchForm = getByID("searchForm")
const resultsUL = getByID("search-results")
const searchImg = getByID("search-card-img")
const collImg = getByID("collection-card-img")
const collContainer = getByID("card-list")
const addForm = getByID("addForm")
const updateForm = getByID("updateForm")
const updateBtn = getByID("updateBtn")
const deleteBtn = getByID("deleteBtn")
const randBtn = getByID("randSearch")
const searchFlip = getByID("search-flip-btn")
const collectionFlip = getByID("collection-flip-btn")
const conditionSelect = updateForm.querySelector("select")
const commentTextarea = updateForm.querySelector("textarea")
const updateFoil = updateForm.querySelector("#updateFoil")
const updateArt = updateForm.querySelector("#updateArt")
const updateInputs = [conditionSelect, commentTextarea, updateFoil, updateArt]
const updatePs = () => [...updateForm.querySelectorAll("p")]
const foilOverlay = getByID("collection-foil-overlay")
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

updateForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const pArr = [...updateForm.querySelectorAll("p")]
  const formData = Object.fromEntries(new FormData(updateForm))

  if (updateBtn.value == "Update" && collImg.dataset.cardId) {
    updateBtn.value = "Save"
    deleteBtn.value = "Cancel"

    updatePs().forEach((p) => (p.hidden = true))
    updateInputs.forEach((el) => (el.hidden = false))
    conditionSelect.value = getByID("collection-condition").textContent
    updateForm.querySelector("textarea").value =
      getByID("collection-comment").textContent == "None." ? "" : getByID("collection-comment").textContent
    updateFoil.checked = getByID("collection-foil").textContent === "Yes"
    updateArt.checked = getByID("collection-art").textContent === "Yes"
  } else if (updateBtn.value == "Save") {
    exitEditMode()

    const collectionCard = collContainer.children[collImgIndex()]
    const updateValues = {
      comment: formData.comment,
      cardCondition: formData.condition,
      print: `${"foil" in formData}`,
      artSize: `${"art" in formData}`,
    }

    collectionCard.dataset["comment"] = updateValues.comment
    collectionCard.dataset["cardCondition"] = updateValues.cardCondition
    collectionCard.dataset["print"] = updateValues.print
    collectionCard.dataset["artSize"] = updateValues.artSize

    patchCard(updateValues, collImg.dataset.cardId)

    displayCardInfo(collectionCard, "collection")
  }
})

deleteBtn.addEventListener("click", (e) => {
  if (deleteBtn.value == "Delete" && collContainer.children[collImgIndex()]) {
    if (
      confirm(
        "Are you sure you want to delete this card from your collection? This action cannot be undone.",
      )
    ) {
      collContainer.children[collImgIndex()].remove()
      deleteCard(collImg.dataset.cardId)
      for (const p of [
        ...getByID("collection-text-info").querySelectorAll("p"),
      ]) {
        p.textContent = ""
      }
      getByID("collection-card-name").textContent = ""
      collImg.src = ""
      collImg.dataset.cardId = ""
    }
  }
  if (deleteBtn.value == "Cancel") {
    exitEditMode()
  }
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
      case "ArrowLeft":
        cycleCollection(-1)
        break
      case "ArrowRight":
        cycleCollection(1)
        break
    }
  }
})

getCollection()

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

function cycleCollection(direction) {
  if (collContainer.childElementCount > 0 && collImg.dataset.cardId) {
    let index = collImgIndex() + direction
    if (index >= 0 && index < collContainer.childElementCount) {
      displayCardInfo(collContainer.children[index], "collection")
    }
  } else if (collContainer.childElementCount > 0 && !collImg.dataset.cardId) {
    displayCardInfo(collContainer.children[0], "collection")
  }
}

function exitEditMode() {
  updateBtn.value = "Update"
  deleteBtn.value = "Delete"

  updatePs().forEach((p) => (p.hidden = false))
  updateInputs.forEach((el) => (el.hidden = true))
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
  exitEditMode()

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

  if (mode == "collection") {
    pArr.push(...getByID("collection-info-container").querySelectorAll("p"))
    collImg.src = card.imgurl
    collImg.dataset.cardId = card.id
    collImg.dataset.imgurl = card.imgurl
    collImg.dataset.backimgurl = card.backimgurl

    if (card.flavorName) {
      getByID("collection-card-name").textContent =
        `${card.flavorName} (${card.name})`
    } else {
      getByID("collection-card-name").textContent = card.name
    }
    pArr[5].textContent = card.cardCondition
    pArr[6].textContent = card.print == "true" ? "Yes" : "No"
    pArr[7].textContent = card.artSize == "true" ? "Yes" : "No"
    pArr[8].textContent = card.comment

    if(card.print == "true") {
      foilOverlay.hidden = false
    } else {
      foilOverlay.hidden = true
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
      addToCollection(cardObj)
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

function getCollection() {
  fetch(dbURL)
    .then((res) => res.json())
    .then((collection) => {
      for (const card of collection) {
        addToCollection(card)
      }
    })
}

function addToCollection(cardObj) {
  const newCard = createEle("img")
  newCard.src = cardObj.imgurl

  for (const key in cardObj) {
    newCard.dataset[key] = cardObj[key]
  }

  newCard.addEventListener("click", (e) => {
    displayCardInfo(e.target, "collection")
  })

  collContainer.appendChild(newCard)

  return newCard
}

// AI Written v, used in displayCardInfo() to convert text mana costs to symbols

const MANA_CLASS_OVERRIDES = {
  T: "tap",
  Q: "untap",
  CHAOS: "chaos",
  E: "e",
  PW: "pw",
  TK: "tk",
}

function symbolToClass(sym) {
  if (MANA_CLASS_OVERRIDES[sym]) return MANA_CLASS_OVERRIDES[sym]
  return sym.toLowerCase().replace(/\//g, "")
}

function manaify(text) {
  if (!text) return ""

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  return escaped.replace(/\{([A-Z0-9/]+)\}/g, (_, sym) => {
    const cls = symbolToClass(sym)
    return `<i class="ms ms-${cls} ms-cost ms-shadow"></i>`
  })
}
