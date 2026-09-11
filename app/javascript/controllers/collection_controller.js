import { Controller } from "@hotwired/stimulus"
import { manaify } from "mana"

const dbURL = "http://localhost:4000/cardCollection/"

export default class extends Controller {
  static targets = [
    "list", "image", "foilOverlay", "flipButton",
    "name", "type", "artist", "set", "desc", "flavor",
    "updateForm", "updateButton", "deleteButton",
    "conditionText", "conditionSelect",
    "foilText", "foilCheckbox",
    "artText", "artCheckbox",
    "commentText", "commentTextarea",
  ]

  connect() {
    this.boundKeydown = this.handleKeydown.bind(this)
    document.addEventListener("keydown", this.boundKeydown)

    this.boundAppend = (event) => this.appendCard(event.detail)
    document.addEventListener("collection:add", this.boundAppend)

    this.loadCollection()
  }

  disconnect() {
    document.removeEventListener("keydown", this.boundKeydown)
    document.removeEventListener("collection:add", this.boundAppend)
  }

  loadCollection() {
    fetch(dbURL)
      .then((res) => res.json())
      .then((coll) => coll.forEach((card) => this.appendCard(card)))
  }

  appendCard(cardObj) {
    const img = document.createElement("img")
    img.src = cardObj.imgurl
    for (const key in cardObj) img.dataset[key] = cardObj[key]
    img.setAttribute("data-action", "click->collection#selectCard")
    this.listTarget.appendChild(img)
  }

  selectCard(event) {
    this.displayCard(event.currentTarget)
  }

  displayCard(img) {
    const card = { ...img.dataset }
    this.exitEditMode()
    this.flipButtonTarget.hidden = card.imgurl === card.backimgurl

    this.imageTarget.src = card.imgurl
    this.imageTarget.dataset.cardId = card.id
    this.imageTarget.dataset.imgurl = card.imgurl
    this.imageTarget.dataset.backimgurl = card.backimgurl

    this.nameTarget.textContent = card.flavorName ? `${card.flavorName} (${card.name})` : card.name
    this.typeTarget.textContent = card.typeLine || "None."
    this.artistTarget.textContent = card.artist || "None."
    this.setTarget.textContent = card.set || "None."
    this.descTarget.innerHTML = manaify(card.oracleText) || "None."
    this.flavorTarget.textContent = card.flavorText || "None."

    this.conditionTextTarget.textContent = card.cardCondition
    this.foilTextTarget.textContent = card.print === "true" ? "Yes" : "No"
    this.artTextTarget.textContent = card.artSize === "true" ? "Yes" : "No"
    this.commentTextTarget.textContent = card.comment

    this.foilOverlayTarget.hidden = card.print !== "true"
  }

  submitUpdate(event) {
    event.preventDefault()

    if (this.updateButtonTarget.value === "Update" && this.imageTarget.dataset.cardId) {
      this.enterEditMode()
      return
    }

    if(this.updateButtonTarget.value === "Save") {
      const formData = Object.fromEntries(new FormData(this.updateFormTarget))
      this.exitEditMode()

      const updates = {
        comment: formData.comment,
        cardCondition: formData.condition,
        print: `${"foil" in formData}`,
        artSize: `${"art" in formData}`
      }

      const img = this.listTarget.querySelector(`[data-id='${this.imageTarget.dataset.cardId}']`)
      Object.assign(img.dataset, updates)

      this.patchCard(updates, this.imageTarget.dataset.cardId)
      this.displayCard(img)
    }
  }

  handleDelete() {
    if (this.deleteButtonTarget.value === "Delete" && this.imageTarget.dataset.cardId) {
      if (!confirm("Are you sure you want to delete this card from your collection? This action cannot be undone.")) return

      this.listTarget.querySelector(`[data-id='${this.imageTarget.dataset.cardId}']`)?.remove()
      this.deleteCard(this.imageTarget.dataset.cardId)
      this.clearDisplay()
    }

    if (this.deleteButtonTarget.value === "Cancel") this.exitEditMode()
  }

  enterEditMode() {
    this.updateButtonTarget.value = "Save"
    this.deleteButtonTarget.value = "Cancel"
    ;[this.conditionTextTarget, this.foilTextTarget, this.artTextTarget, this.commentTextTarget].forEach((el) => (el.hidden = true))
    ;[this.conditionSelectTarget, this.foilCheckboxTarget, this.artCheckboxTarget, this.commentTextareaTarget].forEach((el) => (el.hidden = false))

    this.conditionSelectTarget.value = this.conditionTextTarget.textContent
    this.commentTextareaTarget.value = this.commentTextTarget.textContent === "None." ? "" : this.commentTextTarget.textContent
    this.foilCheckboxTarget.checked = this.foilTextTarget.textContent === "Yes"
    this.artCheckboxTarget.checked = this.artTextTarget.textContent === "Yes"
  }

  exitEditMode() {
    this.updateButtonTarget.value = "Update"
    this.deleteButtonTarget.value = "Delete"
    ;[this.conditionTextTarget, this.foilTextTarget, this.artTextTarget, this.commentTextTarget].forEach((el) => (el.hidden = false))
    ;[this.conditionSelectTarget, this.foilCheckboxTarget, this.artCheckboxTarget, this.commentTextareaTarget].forEach((el) => (el.hidden = true))
  }

  clearDisplay() {
    ;[this.typeTarget, this.artistTarget, this.setTarget, this.descTarget, this.flavorTarget,
      this.conditionTextTarget, this.foilTextTarget, this.artTextTarget, this.commentTextTarget]
      .forEach((el) => (el.textContent = ""))
    this.nameTarget.textContent = ""
    this.imageTarget.src = ""
    this.imageTarget.dataset.cardId = ""
  }

  handleKeydown(event) {
    if ([...document.getElementsByClassName("textInput")].includes(document.activeElement)) return
    if (event.key === "ArrowLeft") this.cycle(-1)
    if (event.key === "ArrowRight") this.cycle(1)
  }

  cycle(direction) {
    const cards = [...this.listTarget.children]
    if (cards.length === 0) return

    if (this.imageTarget.dataset.cardId) {
      const index = cards.findIndex((img) => img.dataset.id === this.imageTarget.dataset.cardId) + direction
      if (index >= 0 && index < cards.length) this.displayCard(cards[index])
    } else {
      this.displayCard(cards[0])
    }
  }

  patchCard(updates, cardId) {
    fetch(dbURL + cardId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).then((res) => res.json())
  }

  deleteCard(cardId) {
    fetch(dbURL + cardId, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json())
  }
}