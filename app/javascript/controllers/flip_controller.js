import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["image"]

  toggle() {
    const img = this.imageTarget
    if (img.src === img.dataset.imgurl) img.src = img.dataset.backimgurl
    else if (img.src === img.dataset.backimgurl) img.src = img.dataset.imgurl
  }
}