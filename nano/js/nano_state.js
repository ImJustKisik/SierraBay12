function NanoStateClass() {
}

NanoStateClass.prototype.key = null
NanoStateClass.prototype.layoutRendered = false
NanoStateClass.prototype.contentRendered = false
NanoStateClass.prototype.mapInitialised = false

NanoStateClass.prototype.isCurrent = function () {
  return NanoStateManager.getCurrentState() === this
}

NanoStateClass.prototype.onAdd = function (previousState) {
  NanoBaseCallbacks.addCallbacks()
  NanoBaseHelpers.addHelpers()
}

NanoStateClass.prototype.onRemove = function (nextState) {
  NanoBaseCallbacks.removeCallbacks()
  NanoBaseHelpers.removeHelpers()
}

NanoStateClass.prototype.onBeforeUpdate = function (data) {
  data = NanoStateManager.executeBeforeUpdateCallbacks(data)
  return data
}

// Morphdom-powered DOM diffing: only updates changed elements, eliminating flicker.
// Falls back to jQuery .html() if morphdom is not available.
NanoStateClass.prototype._morphContent = function (targetId, newHtml) {
  var el = document.getElementById(targetId)
  if (!el) return
  if (typeof morphdom === 'function') {
    var tmp = document.createElement(el.tagName)
    tmp.innerHTML = newHtml
    morphdom(el, tmp, { childrenOnly: true })
  } else {
    $('#' + targetId).html(newHtml)
  }
}

NanoStateClass.prototype.onUpdate = function (data) {
  try {
    if (!this.layoutRendered || (data['config'].hasOwnProperty('autoUpdateLayout') && data['config']['autoUpdateLayout'])) {
      this._morphContent('uiLayout', NanoTemplate.parse('layout', data))
      this.layoutRendered = true
    }
    if (!this.contentRendered || (data['config'].hasOwnProperty('autoUpdateContent') && data['config']['autoUpdateContent'])) {
      this._morphContent('uiContent', NanoTemplate.parse('main', data))
      if (NanoTemplate.templateExists('layoutHeader'))
        this._morphContent('uiHeaderContent', NanoTemplate.parse('layoutHeader', data))
      this.contentRendered = true
    }
    if (NanoTemplate.templateExists('mapContent')) {
      if (!this.mapInitialised) {
        $('#uiMap').draggable()
        $('#uiMapTooltip')
          .off('click')
          .on('click', function (event) {
            event.preventDefault()
            $(this).fadeOut(400)
          })
        this.mapInitialised = true
      }
      this._morphContent('uiMapContent', NanoTemplate.parse('mapContent', data))
      if (data['config'].hasOwnProperty('showMap') && data['config']['showMap']) {
        $('#uiContent').addClass('hidden')
        $('#uiMapWrapper').removeClass('hidden')
      }
      else {
        $('#uiMapWrapper').addClass('hidden')
        $('#uiContent').removeClass('hidden')
      }
    }
    if (NanoTemplate.templateExists('mapHeader'))
      this._morphContent('uiMapHeader', NanoTemplate.parse('mapHeader', data))
    if (NanoTemplate.templateExists('mapFooter'))
      this._morphContent('uiMapFooter', NanoTemplate.parse('mapFooter', data))
  }
  catch (error) {
    alert('ERROR: An error occurred while rendering the UI: ' + error.message)
    return
  }
}

NanoStateClass.prototype.onAfterUpdate = function (data) {
  NanoStateManager.executeAfterUpdateCallbacks(data)
}

NanoStateClass.prototype.alertText = function (text) {
  alert(text)
}
