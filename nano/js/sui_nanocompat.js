;(function () {
    'use strict'

    var h = SUI.h
    var useBackend = SUI.useBackend
    var useEffect = SUI.useEffect
    var useRef = SUI.useRef

    function reportCompatIssue(kind, message) {
        if (window.assetV2Report) {
            window.assetV2Report(kind || 'debug', String(message || ''))
        }
        if (kind === 'error' && window.setUiLoadingError) {
            window.setUiLoadingError(String(message || 'NanoCompat bootstrap failed.'))
        }
    }

    function ensureLegacyPrototypeShims() {
        if (!Array.prototype.indexOf) {
            Array.prototype.indexOf = function (searchElement, fromIndex) {
                var length = this.length
                var index = fromIndex || 0
                if (!length) {
                    return -1
                }
                if (index < 0) {
                    index = Math.max(0, length + index)
                }
                for (; index < length; index++) {
                    if (this[index] === searchElement) {
                        return index
                    }
                }
                return -1
            }
        }

        if (!String.prototype.format) {
            String.prototype.format = function (args) {
                var str = this
                return str.replace(String.prototype.format.regex, function (item) {
                    var intVal = parseInt(item.substring(1, item.length - 1), 10)
                    var replace
                    if (intVal >= 0) {
                        replace = args[intVal]
                    } else if (intVal === -1) {
                        replace = '{'
                    } else if (intVal === -2) {
                        replace = '}'
                    } else {
                        replace = ''
                    }
                    return replace
                })
            }
            String.prototype.format.regex = new RegExp('{-?[0-9]+}', 'g')
        }

        if (!Object.size) {
            Object.size = function (obj) {
                var size = 0
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        size++
                    }
                }
                return size
            }
        }

        if (!String.prototype.toTitleCase) {
            String.prototype.toTitleCase = function () {
                var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|vs?\.?|via)$/i
                return this.replace(/([^\W_]+[^\s-]*) */g, function (match, p1, index, title) {
                    if (index > 0
                        && index + p1.length !== title.length
                        && p1.search(smallWords) > -1
                        && title.charAt(index - 2) !== ':'
                        && title.charAt(index - 1).search(/[^\s-]/) < 0) {
                        return match.toLowerCase()
                    }
                    if (p1.substr(1).search(/[A-Z]|\../) > -1) {
                        return match
                    }
                    return match.charAt(0).toUpperCase() + match.substr(1)
                })
            }
        }

        if (!Function.prototype.inheritsFrom) {
            Function.prototype.inheritsFrom = function (parentClassOrObject) {
                this.prototype = new parentClassOrObject()
                this.prototype.constructor = this
                this.prototype.parent = parentClassOrObject.prototype
                return this
            }
        }

        if (!String.prototype.trim) {
            String.prototype.trim = function () {
                return this.replace(/^\s+|\s+$/g, '')
            }
        }

        if (!String.prototype.ckey) {
            String.prototype.ckey = function () {
                return this.replace(/\W/g, '').toLowerCase()
            }
        }
    }

    function readBodyJsonAttribute(attributeName, fallback) {
        var body = document.body
        if (!body || !body.getAttribute) {
            return fallback
        }
        try {
            return JSON.parse(body.getAttribute(attributeName) || '{}')
        } catch (error) {
            return fallback
        }
    }

    function decodeLegacyValue(value) {
        var text = String(value == null ? '' : value)
        try {
            return decodeURIComponent(text.replace(/\+/g, '%20'))
        } catch (error) {
            return text
        }
    }

    function parseLegacyHref(href) {
        var params = {}
        if (!href) {
            return params
        }
        var text = String(href)
        if (text.charAt(0) === '?') {
            text = text.substring(1)
        }
        var parts = text.split(';')
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i]
            if (!part) {
                continue
            }
            var eqIndex = part.indexOf('=')
            if (eqIndex === -1) {
                params[decodeLegacyValue(part)] = ''
                continue
            }
            var key = decodeLegacyValue(part.substring(0, eqIndex))
            var value = decodeLegacyValue(part.substring(eqIndex + 1))
            params[key] = value
        }
        return params
    }

    function NanoCompatRuntime(root) {
        this.root = root
        this.backendAct = null
        this.pendingPayload = null
        this.loading = false
        this.assetsReady = false
        this.assetSignature = null
        this.loadedStylesheets = {}
        this.loadedScripts = {}
        this._urlParameters = readBodyJsonAttribute('data-url-parameters', {})
        this._canClick = true
        ensureLegacyPrototypeShims()
        this.rebuildLegacyRuntime()
    }

    NanoCompatRuntime.prototype.ensureShell = function () {
        if (!this.root) {
            return
        }
        if (!document.getElementById('uiLayout')) {
            this.root.innerHTML = "<div id='uiLayout'></div>"
        }
    }

    NanoCompatRuntime.prototype.rebuildLegacyRuntime = function () {
        var runtime = this
        runtime.ensureShell()

        runtime.NanoUtility = {
            init: function () {
                runtime._urlParameters = readBodyJsonAttribute('data-url-parameters', {})
            },
            generateHref: function (parameters) {
                var queryString = '?'
                var key
                for (key in runtime._urlParameters) {
                    if (runtime._urlParameters.hasOwnProperty(key)) {
                        if (queryString !== '?') {
                            queryString += ';'
                        }
                        queryString += key + '=' + runtime._urlParameters[key]
                    }
                }
                for (key in parameters) {
                    if (parameters.hasOwnProperty(key)) {
                        if (queryString !== '?') {
                            queryString += ';'
                        }
                        queryString += key + '=' + parameters[key]
                    }
                }
                return queryString
            }
        }

        var templateStore = {}
        var compiledTemplates = {}
        var templateHelpers = {}
        runtime.NanoTemplate = {
            init: function () {
                return
            },
            addTemplate: function (key, templateString) {
                templateStore[key] = templateString
                compiledTemplates[key] = null
            },
            templateExists: function (key) {
                return templateStore.hasOwnProperty(key)
            },
            parse: function (templateKey, data) {
                if (!compiledTemplates.hasOwnProperty(templateKey) || !compiledTemplates[templateKey]) {
                    if (!templateStore.hasOwnProperty(templateKey)) {
                        reportCompatIssue('error', 'template missing: ' + templateKey)
                        return '<h2>Template error (does not exist)</h2>'
                    }
                    try {
                        compiledTemplates[templateKey] = doT.template(templateStore[templateKey], null, templateStore)
                    } catch (error) {
                        reportCompatIssue('error', 'template compile failed: ' + templateKey + ' -> ' + error.message)
                        return '<h2>Template error (failed to compile)</h2>'
                    }
                }
                if (typeof compiledTemplates[templateKey] !== 'function') {
                    return '<h2>Template error (not callable)</h2>'
                }
                return compiledTemplates[templateKey].call(this, data.data, data.config, templateHelpers)
            },
            addHelper: function (helperName, helperFunction) {
                if (!jQuery.isFunction(helperFunction)) {
                    return
                }
                templateHelpers[helperName] = helperFunction
            },
            addHelpers: function (helpers) {
                for (var helperName in helpers) {
                    if (helpers.hasOwnProperty(helperName)) {
                        runtime.NanoTemplate.addHelper(helperName, helpers[helperName])
                    }
                }
            },
            removeHelper: function (helperName) {
                if (templateHelpers.hasOwnProperty(helperName)) {
                    delete templateHelpers[helperName]
                }
            }
        }

        function NanoStateClass() {
        }

        NanoStateClass.prototype.key = null
        NanoStateClass.prototype.layoutRendered = false
        NanoStateClass.prototype.contentRendered = false
        NanoStateClass.prototype.mapInitialised = false

        NanoStateClass.prototype.isCurrent = function () {
            return runtime.NanoStateManager.getCurrentState() === this
        }

        NanoStateClass.prototype.onAdd = function () {
            runtime.NanoBaseCallbacks.addCallbacks()
            runtime.NanoBaseHelpers.addHelpers()
        }

        NanoStateClass.prototype.onRemove = function () {
            runtime.NanoBaseCallbacks.removeCallbacks()
            runtime.NanoBaseHelpers.removeHelpers()
        }

        NanoStateClass.prototype.onBeforeUpdate = function (data) {
            return runtime.NanoStateManager.executeBeforeUpdateCallbacks(data)
        }

        NanoStateClass.prototype._morphContent = function (targetId, newHtml) {
            var target = jQuery(runtime.root).find('#' + targetId).get(0)
            if (!target) {
                return
            }
            if (typeof morphdom === 'function') {
                var wrapper = document.createElement(target.tagName || 'div')
                wrapper.innerHTML = newHtml
                morphdom(target, wrapper, { childrenOnly: true })
            } else {
                target.innerHTML = newHtml
            }
        }

        NanoStateClass.prototype.onUpdate = function (data) {
            if (!this.layoutRendered || (data.config.hasOwnProperty('autoUpdateLayout') && data.config.autoUpdateLayout)) {
                this._morphContent('uiLayout', runtime.NanoTemplate.parse('layout', data))
                this.layoutRendered = true
            }
            if (!this.contentRendered || (data.config.hasOwnProperty('autoUpdateContent') && data.config.autoUpdateContent)) {
                this._morphContent('uiContent', runtime.NanoTemplate.parse('main', data))
                if (runtime.NanoTemplate.templateExists('layoutHeader')) {
                    this._morphContent('uiHeaderContent', runtime.NanoTemplate.parse('layoutHeader', data))
                }
                this.contentRendered = true
            }
            if (runtime.NanoTemplate.templateExists('mapContent')) {
                if (!this.mapInitialised) {
                    var uiMap = jQuery(runtime.root).find('#uiMap')
                    if (uiMap.length && uiMap.draggable) {
                        uiMap.draggable()
                    }
                    jQuery(runtime.root).find('#uiMapTooltip')
                        .off('click.nanocompat')
                        .on('click.nanocompat', function (event) {
                            event.preventDefault()
                            jQuery(this).fadeOut(400)
                        })
                    this.mapInitialised = true
                }
                this._morphContent('uiMapContent', runtime.NanoTemplate.parse('mapContent', data))
                if (data.config.hasOwnProperty('showMap') && data.config.showMap) {
                    jQuery(runtime.root).find('#uiContent').addClass('hidden')
                    jQuery(runtime.root).find('#uiMapWrapper').removeClass('hidden')
                } else {
                    jQuery(runtime.root).find('#uiMapWrapper').addClass('hidden')
                    jQuery(runtime.root).find('#uiContent').removeClass('hidden')
                }
            }
            if (runtime.NanoTemplate.templateExists('mapHeader')) {
                this._morphContent('uiMapHeader', runtime.NanoTemplate.parse('mapHeader', data))
            }
            if (runtime.NanoTemplate.templateExists('mapFooter')) {
                this._morphContent('uiMapFooter', runtime.NanoTemplate.parse('mapFooter', data))
            }
        }

        NanoStateClass.prototype.onAfterUpdate = function (data) {
            runtime.NanoStateManager.executeAfterUpdateCallbacks(data)
        }

        NanoStateClass.prototype.alertText = function (text) {
            alert(text)
        }

        runtime.NanoStateClass = NanoStateClass

        var beforeUpdateCallbacks = {}
        var afterUpdateCallbacks = {}
        var states = {}
        var currentState = null
        runtime.NanoStateManager = {
            init: function () {
                return
            },
            receiveUpdateData: function (jsonString) {
                try {
                    var updateData = JSON.parse(jsonString)
                    runtime.NanoStateManager.receiveCompatData(updateData)
                } catch (error) {
                    reportCompatIssue('error', 'receiveUpdateData parse failed: ' + error.message)
                }
            },
            receiveCompatData: function (updateData) {
                if (!updateData) {
                    return
                }
                runtime.applyLegacyUpdate(updateData)
            },
            addBeforeUpdateCallback: function (key, callbackFunction) {
                beforeUpdateCallbacks[key] = callbackFunction
            },
            addBeforeUpdateCallbacks: function (callbacks) {
                for (var callbackKey in callbacks) {
                    if (callbacks.hasOwnProperty(callbackKey)) {
                        beforeUpdateCallbacks[callbackKey] = callbacks[callbackKey]
                    }
                }
            },
            removeBeforeUpdateCallback: function (key) {
                if (beforeUpdateCallbacks.hasOwnProperty(key)) {
                    delete beforeUpdateCallbacks[key]
                }
            },
            executeBeforeUpdateCallbacks: function (data) {
                for (var key in beforeUpdateCallbacks) {
                    if (beforeUpdateCallbacks.hasOwnProperty(key) && jQuery.isFunction(beforeUpdateCallbacks[key])) {
                        data = beforeUpdateCallbacks[key].call(this, data)
                    }
                }
                return data
            },
            addAfterUpdateCallback: function (key, callbackFunction) {
                afterUpdateCallbacks[key] = callbackFunction
            },
            addAfterUpdateCallbacks: function (callbacks) {
                for (var callbackKey in callbacks) {
                    if (callbacks.hasOwnProperty(callbackKey)) {
                        afterUpdateCallbacks[callbackKey] = callbacks[callbackKey]
                    }
                }
            },
            removeAfterUpdateCallback: function (key) {
                if (afterUpdateCallbacks.hasOwnProperty(key)) {
                    delete afterUpdateCallbacks[key]
                }
            },
            executeAfterUpdateCallbacks: function (data) {
                for (var key in afterUpdateCallbacks) {
                    if (afterUpdateCallbacks.hasOwnProperty(key) && jQuery.isFunction(afterUpdateCallbacks[key])) {
                        data = afterUpdateCallbacks[key].call(this, data)
                    }
                }
                return data
            },
            addState: function (state) {
                if (!(state instanceof runtime.NanoStateClass) || !state.key) {
                    reportCompatIssue('error', 'invalid state registration')
                    return
                }
                states[state.key] = state
            },
            setCurrentState: function (stateKey) {
                if (!stateKey || !states.hasOwnProperty(stateKey)) {
                    reportCompatIssue('error', 'missing state: ' + stateKey)
                    return false
                }
                var previousState = currentState
                currentState = states[stateKey]
                if (previousState) {
                    previousState.onRemove(currentState)
                }
                currentState.onAdd(previousState)
                return true
            },
            getCurrentState: function () {
                return currentState
            }
        }

        runtime.NanoBaseHelpers = (function () {
            var baseHelpers = {
                syndicateMode: function () {
                    SUI.applyThemeMode('syndicate')
                    return ''
                },
                ntscieMode: function () {
                    SUI.applyThemeMode('ntscie')
                    return ''
                },
                DAISMode: function () {
                    SUI.applyThemeMode('dais')
                    return ''
                },
                TechMode: function () {
                    SUI.applyThemeMode('tech')
                    return ''
                },
                link: function (text, icon, parameters, status, elementClass, elementId) {
                    var iconHtml = ''
                    var iconClass = 'noIcon'
                    if (typeof icon !== 'undefined' && icon) {
                        iconHtml = '<div class="uiLinkPendingIcon"></div><div class="uiIcon16 icon-' + icon + '"></div>'
                        iconClass = 'hasIcon'
                    }
                    if (typeof elementClass === 'undefined' || !elementClass) {
                        elementClass = 'link'
                    }
                    var elementIdHtml = ''
                    if (typeof elementId !== 'undefined' && elementId) {
                        elementIdHtml = 'id="' + elementId + '"'
                    }
                    if (typeof status !== 'undefined' && status) {
                        return '<div unselectable="on" class="link ' + iconClass + ' ' + elementClass + ' ' + status + '" ' + elementIdHtml + '>' + iconHtml + text + '</div>'
                    }
                    return '<div unselectable="on" class="linkActive ' + iconClass + ' ' + elementClass + '" data-href="' + runtime.NanoUtility.generateHref(parameters) + '" ' + elementIdHtml + '>' + iconHtml + text + '</div>'
                },
                round: function (number) {
                    return Math.round(number)
                },
                fixed: function (number) {
                    return Math.round(number * 10) / 10
                },
                floor: function (number) {
                    return Math.floor(number)
                },
                ceil: function (number) {
                    return Math.ceil(number)
                },
                string: function () {
                    if (arguments.length === 0) {
                        return ''
                    }
                    if (arguments.length === 1) {
                        return arguments[0]
                    }
                    var stringArgs = []
                    for (var i = 1; i < arguments.length; i++) {
                        stringArgs.push(arguments[i])
                    }
                    return arguments[0].format(stringArgs)
                },
                formatNumber: function (x) {
                    var parts = String(x).split('.')
                    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    return parts.join('.')
                },
                capitalizeFirstLetter: function (string) {
                    string = String(string || '')
                    return string.charAt(0).toUpperCase() + string.slice(1)
                },
                displayBar: function (value, rangeMin, rangeMax, styleClass, showText, difClass, direction) {
                    if (rangeMin < rangeMax) {
                        if (value < rangeMin) {
                            value = rangeMin
                        } else if (value > rangeMax) {
                            value = rangeMax
                        }
                    } else if (value > rangeMin) {
                        value = rangeMin
                    } else if (value < rangeMax) {
                        value = rangeMax
                    }
                    if (typeof styleClass === 'undefined' || !styleClass) {
                        styleClass = ''
                    }
                    if (typeof showText === 'undefined' || !showText) {
                        showText = ''
                    }
                    if (typeof difClass === 'undefined' || !difClass) {
                        difClass = ''
                    }
                    if (typeof direction === 'undefined' || !direction) {
                        direction = 'width'
                    } else {
                        direction = 'height'
                    }
                    var percentage = Math.round((value - rangeMin) / (rangeMax - rangeMin) * 100)
                    return '<div class="displayBar' + difClass + ' ' + styleClass + '"><div class="displayBar' + difClass + 'Fill ' + styleClass + '" style="' + direction + ': ' + percentage + '%;"></div><div class="displayBar' + difClass + 'Text ' + styleClass + '">' + showText + '</div></div>'
                },
                displayDNABlocks: function (dnaString, selectedBlock, selectedSubblock, blockSize, paramKey) {
                    if (!dnaString) {
                        return '<div class="notice">Please place a valid subject into the DNA modifier.</div>'
                    }
                    var characters = dnaString.split('')
                    var html = '<div class="dnaBlock"><div class="link dnaBlockNumber">1</div>'
                    var block = 1
                    var subblock = 1
                    var index
                    for (index in characters) {
                        if (!characters.hasOwnProperty(index) || typeof characters[index] === 'object') {
                            continue
                        }
                        var parameters
                        if (paramKey.toUpperCase() === 'UI') {
                            parameters = { selectUIBlock: block, selectUISubblock: subblock }
                        } else {
                            parameters = { selectSEBlock: block, selectSESubblock: subblock }
                        }
                        var status = 'linkActive'
                        if (block === selectedBlock && subblock === selectedSubblock) {
                            status = 'selected'
                        }
                        html += '<div class="link ' + status + ' dnaSubBlock" data-href="' + runtime.NanoUtility.generateHref(parameters) + '" id="dnaBlock' + index + '">' + characters[index] + '</div>'
                        index++
                        if (index % blockSize === 0 && index < characters.length) {
                            block++
                            subblock = 1
                            html += '</div><div class="dnaBlock"><div class="link dnaBlockNumber">' + block + '</div>'
                        } else {
                            subblock++
                        }
                    }
                    html += '</div>'
                    return html
                }
            }

            return {
                addHelpers: function () {
                    runtime.NanoTemplate.addHelpers(baseHelpers)
                },
                removeHelpers: function () {
                    for (var helperKey in baseHelpers) {
                        if (baseHelpers.hasOwnProperty(helperKey)) {
                            runtime.NanoTemplate.removeHelper(helperKey)
                        }
                    }
                }
            }
        })()

        runtime.NanoBaseCallbacks = (function () {
            var baseAfterUpdateCallbacks = {
                status: function (updateData) {
                    var status = updateData.config.status
                    var uiStatusClass
                    var links = jQuery(runtime.root).find('.linkActive')
                    if (status == 2) {
                        uiStatusClass = 'icon24 uiStatusGood'
                        links.removeClass('inactive')
                    } else if (status == 1) {
                        uiStatusClass = 'icon24 uiStatusAverage'
                        links.addClass('inactive')
                    } else {
                        uiStatusClass = 'icon24 uiStatusBad'
                        links.addClass('inactive')
                    }
                    jQuery(runtime.root).find('#uiStatusIcon').attr('class', uiStatusClass)
                    if (links.stopTime) {
                        links.stopTime('linkPending')
                    }
                    links.removeClass('linkPending')
                    links.off('click.nanocompat').on('click.nanocompat', function (event) {
                        event.preventDefault()
                        var href = jQuery(this).data('href')
                        if (href != null && runtime._canClick) {
                            runtime._canClick = false
                            window.setTimeout(function () {
                                runtime._canClick = true
                            }, 300)
                            if (status == 2) {
                                var linkNode = this
                                window.setTimeout(function () {
                                    jQuery(linkNode).addClass('linkPending')
                                }, 300)
                            }
                            runtime.dispatchLegacyHref(href)
                        }
                    })
                    return updateData
                },
                nanomap: function (updateData) {
                    jQuery(runtime.root).find('.mapIcon')
                        .off('mouseenter.nanocompat mouseleave.nanocompat')
                        .on('mouseenter.nanocompat', function () {
                            jQuery(runtime.root).find('#uiMapTooltip')
                                .html(jQuery(this).children('.tooltip').html())
                                .show()
                            window.setTimeout(function () {
                                jQuery(runtime.root).find('#uiMapTooltip').fadeOut(500)
                            }, 5000)
                        })
                    jQuery(runtime.root).find('.zoomLink')
                        .off('click.nanocompat')
                        .on('click.nanocompat', function (event) {
                            event.preventDefault()
                            var zoomLevel = jQuery(this).data('zoomLevel')
                            jQuery(runtime.root).find('#uiMap').css({
                                transform: 'scale(' + zoomLevel + ')'
                            })
                        })
                    jQuery(runtime.root).find('#uiMapImage').attr('src', updateData.config.mapName + '-' + updateData.config.mapZLevel + '.png')
                    return updateData
                }
            }

            return {
                addCallbacks: function () {
                    runtime.NanoStateManager.addAfterUpdateCallbacks(baseAfterUpdateCallbacks)
                },
                removeCallbacks: function () {
                    for (var callbackKey in baseAfterUpdateCallbacks) {
                        if (baseAfterUpdateCallbacks.hasOwnProperty(callbackKey)) {
                            runtime.NanoStateManager.removeAfterUpdateCallback(callbackKey)
                        }
                    }
                }
            }
        })()

        function NanoStateDefaultClass() {
            this.key = 'default'
            runtime.NanoStateManager.addState(this)
        }
        NanoStateDefaultClass.inheritsFrom(runtime.NanoStateClass)
        runtime.NanoStateDefault = new NanoStateDefaultClass()

        window.NanoUtility = runtime.NanoUtility
        window.NanoTemplate = runtime.NanoTemplate
        window.NanoStateClass = runtime.NanoStateClass
        window.NanoStateManager = runtime.NanoStateManager
        window.NanoStateDefault = runtime.NanoStateDefault
        window.NanoBaseHelpers = runtime.NanoBaseHelpers
        window.NanoBaseCallbacks = runtime.NanoBaseCallbacks
        window.receiveUpdateData = function (jsonString) {
            window.NanoStateManager.receiveUpdateData(jsonString)
        }

        runtime.NanoUtility.init()
    }

    NanoCompatRuntime.prototype.dispatchLegacyHref = function (href) {
        if (!this.backendAct) {
            return
        }
        var params = parseLegacyHref(href)
        if (params.hasOwnProperty('src')) {
            delete params.src
        }
        params.legacy_href_raw = href
        this.backendAct('legacy_href', params)
    }

    NanoCompatRuntime.prototype.loadStylesheets = function (entries, index, done) {
        var runtime = this
        if (!entries || index >= entries.length) {
            done()
            return
        }
        var entry = entries[index]
        if (!entry || !entry.url || runtime.loadedStylesheets[entry.url]) {
            runtime.loadStylesheets(entries, index + 1, done)
            return
        }
        var link = document.createElement('link')
        link.rel = 'stylesheet'
        link.type = 'text/css'
        link.href = entry.url
        runtime.loadedStylesheets[entry.url] = true
        document.getElementsByTagName('head')[0].appendChild(link)
        runtime.loadStylesheets(entries, index + 1, done)
    }

    NanoCompatRuntime.prototype.loadScripts = function (entries, index, done) {
        var runtime = this
        if (!entries || index >= entries.length) {
            done()
            return
        }
        var entry = entries[index]
        if (!entry || !entry.url || runtime.loadedScripts[entry.url]) {
            runtime.loadScripts(entries, index + 1, done)
            return
        }
        var script = document.createElement('script')
        var completed = false
        script.type = 'text/javascript'
        script.src = entry.url
        script.async = false
        script.defer = false
        script.onload = function () {
            if (completed) {
                return
            }
            completed = true
            runtime.loadedScripts[entry.url] = true
            runtime.loadScripts(entries, index + 1, done)
        }
        script.onreadystatechange = function () {
            if (!completed && (this.readyState === 'loaded' || this.readyState === 'complete')) {
                completed = true
                this.onreadystatechange = null
                runtime.loadedScripts[entry.url] = true
                runtime.loadScripts(entries, index + 1, done)
            }
        }
        script.onerror = function () {
            if (completed) {
                return
            }
            completed = true
            reportCompatIssue('error', 'script load failed: ' + entry.url)
            runtime.loadScripts(entries, index + 1, done)
        }
        document.getElementsByTagName('head')[0].appendChild(script)
    }

    NanoCompatRuntime.prototype.loadTemplates = function (templates, keys, index, done) {
        var runtime = this
        if (!keys || index >= keys.length) {
            done()
            return
        }
        var key = keys[index]
        var entry = templates[key]
        if (!entry || !entry.url) {
            runtime.loadTemplates(templates, keys, index + 1, done)
            return
        }
        jQuery.ajax({
            url: entry.url,
            cache: false,
            dataType: 'text'
        }).done(function (templateMarkup) {
            runtime.NanoTemplate.addTemplate(key, templateMarkup + '<div class="clearBoth"></div>')
            runtime.loadTemplates(templates, keys, index + 1, done)
        }).fail(function () {
            reportCompatIssue('error', 'template load failed: ' + key + ' -> ' + entry.url)
            runtime.loadTemplates(templates, keys, index + 1, done)
        })
    }

    NanoCompatRuntime.prototype.getAssetSignature = function (assets) {
        try {
            return JSON.stringify(assets || {})
        } catch (error) {
            return ''
        }
    }

    NanoCompatRuntime.prototype.beginAssetLoad = function (payload) {
        var runtime = this
        var assets = payload.assets || {}
        runtime.loading = true
        runtime.assetsReady = false
        runtime.rebuildLegacyRuntime()
        runtime.ensureShell()
        runtime.root.innerHTML = "<div id='uiLayout'></div>"
        runtime.loadStylesheets(assets.stylesheets || [], 0, function () {
            runtime.loadScripts(assets.scripts || [], 0, function () {
                var templateKeys = []
                var templates = assets.templates || {}
                for (var key in templates) {
                    if (templates.hasOwnProperty(key)) {
                        templateKeys.push(key)
                    }
                }
                runtime.loadTemplates(templates, templateKeys, 0, function () {
                    runtime.loading = false
                    runtime.assetsReady = true
                    runtime.renderPendingPayload()
                })
            })
        })
    }

    NanoCompatRuntime.prototype.ensureCurrentState = function (stateKey) {
        var resolvedKey = String(stateKey || 'default').toLowerCase()
        if (!window.NanoStateManager.getCurrentState() || window.NanoStateManager.getCurrentState().key !== resolvedKey) {
            if (!window.NanoStateManager.setCurrentState(resolvedKey)) {
                window.NanoStateManager.setCurrentState('default')
            }
        }
    }

    NanoCompatRuntime.prototype.applyLegacyUpdate = function (updateData) {
        if (!updateData) {
            return
        }
        this.ensureShell()
        this.ensureCurrentState(updateData.config && updateData.config.stateKey)
        var state = window.NanoStateManager.getCurrentState()
        if (!state) {
            return
        }
        var processedData = state.onBeforeUpdate(updateData)
        if (processedData === false) {
            return
        }
        state.onUpdate(processedData)
        state.onAfterUpdate(processedData)
        if (window.hideUiLoading) {
            window.hideUiLoading()
        }
    }

    NanoCompatRuntime.prototype.renderPendingPayload = function () {
        if (!this.assetsReady || this.loading || !this.pendingPayload) {
            return
        }
        var payload = this.pendingPayload
        this.applyLegacyUpdate({
            config: payload.config || {},
            data: payload.data || {}
        })
    }

    NanoCompatRuntime.prototype.receivePayload = function (payload, backendAct) {
        this.backendAct = backendAct || this.backendAct
        this.pendingPayload = payload || {}
        this.NanoUtility.init()

        var nextSignature = this.getAssetSignature(this.pendingPayload.assets)
        if (!this.assetsReady || this.assetSignature !== nextSignature) {
            this.assetSignature = nextSignature
            if (!this.loading) {
                this.beginAssetLoad(this.pendingPayload)
            }
            return
        }

        this.renderPendingPayload()
    }

    NanoCompatRuntime.prototype.destroy = function () {
        if (this.root) {
            jQuery(this.root).find('*').off('.nanocompat')
            this.root.innerHTML = ''
        }
    }

    function NanoCompat() {
        var backend = useBackend()
        var rootRef = useRef(null)
        var runtimeRef = useRef(null)

        useEffect(function () {
            if (!runtimeRef.current && rootRef.current) {
                runtimeRef.current = new NanoCompatRuntime(rootRef.current)
            }
            return function () {
                if (runtimeRef.current) {
                    runtimeRef.current.destroy()
                    runtimeRef.current = null
                }
            }
        }, [])

        useEffect(function () {
            if (!rootRef.current) {
                return
            }
            if (!runtimeRef.current) {
                runtimeRef.current = new NanoCompatRuntime(rootRef.current)
            }
            runtimeRef.current.receivePayload(backend.data || {}, backend.act)
        }, [backend.data, backend.act])

        return h('div', {
            ref: function (node) {
                rootRef.current = node
            },
            style: {
                width: '100%',
                minHeight: '100%',
                boxSizing: 'border-box'
            }
        })
    }

    SUI.registerInterface('NanoCompat', NanoCompat)
})()
