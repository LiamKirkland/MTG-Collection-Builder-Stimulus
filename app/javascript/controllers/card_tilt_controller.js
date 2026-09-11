import { Controller } from "@hotwired/stimulus"

const SETTINGS = { max: 25, perspective: 1000, scale: 1.05, foilShift: 35 }

export default class extends Controller {
  static targets = [ "foil" ]

  connect() {
    this.element.addEventListener("mouseenter", this.enter)
    this.element.addEventListener("mousemove", this.move)
    this.element.addEventListener("mouseleave", this.leave)
  }

  disconnect() {
    this.element.removeEventListener("mouseenter", this.enter)
    this.element.removeEventListener("mousemove", this.move)
    this.element.removeEventListener("mouseleave", this.leave)
  }

  enter = () => {
    this.setTransition(this.element)
    if(this.hasFoilTarget) this.setTransition(this.foilTarget)
  }

  move = (event) => {
    const rect = this.element.getBoundingClientRect()
    const rotateX = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    const rotateY = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)

    this.element.style.transform =
      `perspective(${SETTINGS.perspective}px) rotateX(${SETTINGS.max * rotateX}deg) rotateY(${-SETTINGS.max * rotateY}deg) scale3d(${SETTINGS.scale}, ${SETTINGS.scale}, ${SETTINGS.scale})`

    if(this.hasFoilTarget) {
      const foilX = 20 - rotateX * (SETTINGS.foilShift / 2)
      const foilY = 20 - rotateY * (SETTINGS.foilShift / 2)
      this.foilTarget.style.objectPosition = `${foilX}% ${foilY}%`
    }
  }

  leave = () => {
    this.setTransition(this.element)
    this.element.style.transform = `perspective(${SETTINGS.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`

    if(this.hasFoilTarget) {
      this.setTransition(this.foilTarget)
      this.foilTarget.style.objectPosition = "20% 20%"
    }
  }

  setTransition(el) {
    el.style.transition = "transform 300ms cubic-bezier(0.03, 0.98, 0.52, 0.99), object-position 300ms cubic-bezier(0.03, 0.98, 0.52, 0.99)"
    setTimeout(() => { el.style.transition = "" }, 300)
  }
}