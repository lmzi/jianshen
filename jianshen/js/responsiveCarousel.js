
(function ($, window, document) {
    "use strict";

   
    var instanceCount = 0;

    $.widget("ri.responsiveCarousel", {

        
        options: {
            arrowLeft: '.arrow-left span',
            arrowRight: '.arrow-right span',
            mask: '.slider-mask',
            target: 'ul',
            unitElement: 'li',
            unitWidth: 'inherit',
            responsiveUnitSize: null,
            onRedraw: null,
            ondragstart: null,
            ondragend: null,
            dragEvents: false,
            easing: 'linear',
			speed: 400,
			slideSpeed: 2500,
			step: -1,
			responsiveStep: null,
            onShift: null,
            cssAnimations: Modernizr.csstransitions,
            nudgeThreshold: 10,
            infinite: false,
            delta: 1,
            dragVertical: false,
            dragPreventDefault: false,
            lazyload: false 
        },

       
        _getPrefix: function (prop) {
            var prefixes = ['Moz', 'Webkit', 'Khtml', '0', 'ms'],
                elem = document.createElement('div'),
                upper = prop.charAt(0).toUpperCase() + prop.slice(1),
                pref = "",
                len = prefixes.length;

            while (len > -1) {
                if (elem.style[prefixes[len] + upper] !== undefined) {
                    pref = (prefixes[len]);
                }
                len = len - 1;
            }

            if (elem.style[prop]) {
                pref = prop.toLowerCase();
            } else {
                pref =  '-' + pref.toLowerCase() + '-';
            }

            return pref;

        },


       
        _round: function (x) {
          
            if (this.options.unitWidth === 'compute' || this.options.unitWidth === 'inherit' || this.options.unitWidth === 'integer') {
                x = Math.round( x / this.internal.unitWidth) * this.internal.unitWidth;
            }
            return x;
        },

        _animate: function ($target, props, speed, callback) {

            var options = this.options,
                internal = this.internal,
                transition = internal.prefix + 'transition',
                currentLeft = this._round(Math.floor($target.position().left)),
                newLeft = props.left,
                diff = currentLeft + newLeft,
                i,

                _transition = function(o) {
                    $target.css(o);
                },

                _forceRepaint = function () {
                    var $el = $('<div class="redraw-' + instanceCount + '"> </div>');

                    $el.appendTo($target);
                    $el.hide();
                    $el.get(0).offsetHeight; 
                    $el.show();

                    window.setTimeout(function(){
                        $el.remove();
                    },1);

                };


            $target.css(transition,'');
            
            _forceRepaint();

            
            if (options.infinite === true) {
                if (newLeft !== undefined) {
                    if (newLeft < currentLeft) {
                       
                        i = internal.unitWidth * (internal.numUnits - internal.numVisibleUnits) * -1;
                        if (currentLeft === i) {
                           
                            $target.css('left',0);
                            props.left = -internal.unitWidth;
                        }
                       
                    } else if (newLeft > currentLeft) {
                       
                        if (currentLeft === 0 ) {
                           
                            i = Math.floor($target.find('.clone:first').position().left) * -1;
                            $target.css('left',i);
                            props.left = i + diff;
                        }
                      
                    }
                }
            }



          
            window.setTimeout(function(){
                if (options.cssAnimations) {
                    $target.css(transition, 'left ' + speed / 1000 + 's ' + options.easing);
                    _transition(props);
                    window.setTimeout(function () {
                        
                        $target.css(transition, '');
                        if ($.isFunction(callback)) {
                            callback();
                        }
                    }, speed);
                } else {
                    $target.animate(props, speed, function () {
                        if ($.isFunction(callback)) {
                            callback();
                        }
                    });
                }
            },1);

        },

       
        _requestAnimationFrameShim: function() {
            var lastTime = 0,
                vendors = ['ms', 'moz', 'webkit', 'o'],
                x;

           
            if (!window.requestAnimationFrame || !window.cancelAnimationFrame) {

                for(x = 0; x < vendors.length && !window.requestAnimationFrame; x = x + 1) {
                    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
                    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
                }

                if (!window.requestAnimationFrame) {
                    window.requestAnimationFrame = function(callback) {
                        var currTime = new Date().getTime(),
                            timeToCall = Math.max(0, 16 - (currTime - lastTime)),
                            id = window.setTimeout(function() {
                                    callback(currTime + timeToCall);
                                },timeToCall);
                        lastTime = currTime + timeToCall;
                        return id;
                    };
                }

                if (!window.cancelAnimationFrame) {
                    window.cancelAnimationFrame = function(id) {
                        clearTimeout(id);
                    };
                }
            }
        },

       
        _setTargetWidth: function () {
            var internal = this.internal,
                options = this.options,
                numUnits,
                $units = $(options.unitElement),
                i;

            internal.numUnits = $(options.unitElement).length;
            numUnits = internal.numUnits;

            function _individual(dom) {
                var width,
                    $this = $(dom);
               
                $this.css('width','');

               
                width = Math.ceil($this.width()) + 1;  
                $this.width(width);

                
                internal.targetWidth = internal.targetWidth + width;

              
                $this.data("responsiveCarousel",{
                    'width' : width,
                    'top' : Math.floor($this.position().top),
                    'right' : Math.floor($this.position().left) + $this.width(),
                    'bottom' : Math.floor($this.position().top) + $this.height(),
                    'left' : Math.floor($this.position().left)
                });
            }

           
            i = numUnits;
            if (options.unitWidth === 'individual') {
                internal.targetWidth = 0;
                while (i--) {
                    _individual($units[i]);
                }
            }
            
            else {
                internal.targetWidth =  internal.numUnits * internal.unitWidth;
            }


            $(options.target).width(internal.targetWidth); 
            internal.targetHeight = $(options.target).height();
            internal.maskWidth = $(options.mask).width();
            internal.maskHeight = $(options.mask).height();
        },

      
        _setArrowVisibility: function () {

            var options = this.options,
                internal = this.internal,
                $target = $(options.target),
                $arrowLeft = $(options.arrowLeft),
                $arrowRight = $(options.arrowRight),
                maskLeft = 0,
                i,
                maskRight = internal.maskWidth,
                currentLeft  = this._round(Math.floor($target.position().left)), 
                currentRight = internal.targetWidth + currentLeft;

			
            if ($arrowRight.length) {
                if (options.infinite !== true && currentRight <= maskRight) {
                    $arrowRight.addClass('disabled');
                    if (internal.isArrowBeingClicked === true) {
                        this._clearInterval();
                    }
                    internal.arrowRightVisible = internal.isArrowBeingClicked = false;
                } else {
                    $arrowRight.removeClass('disabled');
                    internal.arrowRightVisible = true;
                }
            }


			
            if ($arrowLeft.length) {
                if (options.infinite !== true && currentLeft >= maskLeft) {
                    $arrowLeft.addClass('disabled');
                    if (internal.isArrowBeingClicked === true) {
                        this._clearInterval();
                    }
                    internal.arrowLeftVisible = internal.isArrowBeingClicked  = false;
                } else {
                    $arrowLeft.removeClass('disabled');
                    internal.arrowLeftVisible = true;
                }

            }


            if (options.unitWidth !== 'individual')  {
               
                internal.currentSlide = $(options.unitElement).eq([Math.abs(currentLeft / internal.unitWidth)]).data('slide');
                i = internal.currentSlide;
            }


          
			if ($.isFunction(options.onShift)) {
                if (typeof i === 'number') { 
                    options.onShift(i);
                }
			} else if (options.onShift !== null ) {
                throw new Error('The onShift option must be a function or null if not in use.');
            }

        },


        _clearInterval : function () {
            var internal = this.internal;


            if ('number' === typeof internal.timer) {
                internal.isArrowBeingClicked  = false;
                window.clearInterval(internal.timer);
            }

        },

		
		_doArrowBeingClicked: function (direction) {

            var that = this,
                internal = this.internal,
                options = this.options,
                $target = $(options.target),
                currLeft = Math.floor($target.position().left),
                newLeft,
                minLeft,
                newSpeed = options.speed,
                l, r,
                d, j,
                w = 0,
                found = false,
                i = internal.currentSlide;

            if (internal.busy === true) {
                return;
            }

            if (options.unitWidth === 'individual') {

                
                if (direction === 'right') {
                    if (internal.lastArrowClicked === 'right') {
                       
                        if (i < internal.numUnits - 1) {
                            i = i + 1;
                            d = $(options.unitElement).eq(i).data('responsiveCarousel');
                            newLeft = currLeft - d.width;
                            internal.currentSlide = i;
                        }
                    } else {
                       
                        internal.lastArrowClicked = 'right';
                        r = -1 * currLeft + internal.maskWidth;
                        j = internal.numUnits;
                        while (i < j) {
                            d = $(options.unitElement).eq(i).data('responsiveCarousel');
                            if (r >= d.left && r <= d.right) {
                                newLeft = currLeft - (d.right - r);
                                newSpeed = options.speed - (options.speed * ((r - d.left) / d.width));
                                internal.currentSlide = i;
                                break;
                            } else {
                                w = w + d.width;
                            }
                            i = i + 1;
                        }
                    }
                } else if (direction === "left") {
                    if (internal.lastArrowClicked === 'left') {
                       
                        if (i > 0) {
                            i = i - 1;
                            d = $(options.unitElement).eq(i).data('responsiveCarousel');
                            newLeft = currLeft + d.width;
                            internal.currentSlide = i;
                        }
                    } else {
                      
                        internal.lastArrowClicked = 'left';
                        if ( $(options.unitElement).eq(internal.currentSlide).length ) {
                            l = Math.abs(currLeft);
                            while (i >= 0) {
                                d = $(options.unitElement).eq(i).data('responsiveCarousel');
                                if (l >= d.left && l <= d.right) {
                                    newLeft = currLeft + d.width;
                                    if (d.right > l) {
                                        newLeft = newLeft - (d.right + currLeft);
                                    }
                                    newSpeed = options.speed * ((l - d.left) / d.width);
                                    internal.currentSlide = i;
                                    break;
                                } else {
                                    w = w + d.width;
                                }
                                i = i - 1;
                            }
                        }
                    }
                } else {
                    throw new Error("unknown direction");
                }

            } else {

               
                if (direction === "left") {
                    newLeft =  currLeft  + internal.unitWidth;
                } else if (direction === "right") {
                    newLeft =  currLeft - internal.unitWidth;
                } else {
                    throw new Error("unknown direction");
                }

            }


  
            newLeft = this._round(newLeft);


          
            if (internal.maskWidth < internal.targetWidth) {
                minLeft = internal.maskWidth - internal.targetWidth;
            } else {
                minLeft = 0;
            }
            if (newLeft > 0) { newLeft = 0; }
            if (newLeft < minLeft) { newLeft = minLeft; }

            newSpeed = newSpeed >= 100 ? newSpeed : 100;

         
            internal.busy = true;
            this._animate($target, {left: newLeft}, newSpeed, function () {
                that._setArrowVisibility('_doArrowBeingClicked');
                internal.busy = false;
            });

        },

   
        _setArrowEvents: function () {

            var that = this,
                options = this.options,
                internal = this.internal,
                $arrowLeft = $(options.arrowLeft),
                $arrowRight = $(options.arrowRight),
                eventStringDown = "",
                eventStringUp = "";

          
            $arrowLeft.on('click' + this.instanceId, function (ev) {
                ev.preventDefault();
            });

        
            $arrowRight.on('click' + this.instanceId, function (ev) {
                ev.preventDefault();
            });

        
            if (options.dragEvents === true) {
                eventStringDown = 'mousedown' + this.instanceId +
                    ' touchstart' + this.instanceId +
                    ' gesturestart' + this.instanceId +
                    ' gesturechange' + this.instanceId;
                eventStringUp = 'mouseup' + this.instanceId +
                    ' mouseout' + this.instanceId +
                    ' mouseleave' + this.instanceId +
                    ' touchend' + this.instanceId +
                    ' touchleave' + this.instanceId +
                    ' gestureend' + this.instanceId;
            } else {
                eventStringDown = 'mousedown' + this.instanceId;
                eventStringUp = 'mouseup' + this.instanceId +
                    ' mouseout' + this.instanceId +
                    ' mouseleave' + this.instanceId;
            }

       
            $arrowLeft.on(eventStringDown, function (ev) {

				if(true === internal.ios6Device) {
                    internal.busy = false;
                }

                ev.preventDefault();
                ev.stopPropagation();
                if (internal.busy === false && !$arrowLeft.hasClass('disabled')) {
                    internal.isArrowBeingClicked = internal.firstMouseClick = true;
                    internal.timer = window.setInterval(function () {that._doArrowBeingClicked('left'); }, 10);
            
                    if (internal.slideTimer) {
                        window.clearInterval(internal.slideTimer);
                        internal.slideShowActive = false;
                    }
                }
            });


      
            $arrowRight.on(eventStringDown, function (ev) {

				if(true === internal.ios6Device) {
                    internal.busy = false;
                }

                ev.preventDefault();
                ev.stopPropagation();
                if (internal.busy === false && !$arrowRight.hasClass('disabled')) {
                    internal.isArrowBeingClicked = internal.firstMouseClick = true;
                    internal.timer = window.setInterval(function () {that._doArrowBeingClicked('right'); }, 10);
					
					if (internal.slideTimer) {
                        window.clearInterval(internal.slideTimer);
                        internal.slideShowActive = false;
                    }
                }
            });

           
            $.each([$arrowLeft, $arrowRight], function (){
                $(this).on(eventStringUp, function () {
                    if (internal.isArrowBeingClicked === true) {
                        that._clearInterval();
                    }
                });
            });

         
            $(window).on('scroll' + this.instanceId, function() {
                if (options.unitWidth !== 'individual') {
                    window.clearTimeout(internal.scrollTimer);
                    internal.scrollTimer = window.setTimeout(function(){
                        that._clearInterval();
                    },100);
                }
            });

            $(window).on(' resize' + this.instanceId + ' onorientationchange' + this.instanceId, function(){
                window.clearTimeout(internal.resizeTimer);
                internal.resizeTimer = window.setTimeout(function(){
                    that._setTargetWidth();
                    that._clearInterval();
                },100);
            });




        },

       
        _setUnitWidth: function () {

            var w, m,
                that = this,
                internal = this.internal,
                options = this.options,
                $target = $(options.target),
                $el = $(this.element),
                $units = $(options.unitElement + ':not(.clone)'),
                $firstUnit = $units.eq(0),
                q, $doms, length,

                _importWidthFromDOM = function () {
                    internal.unitWidth = $firstUnit.width();  
                },

                _setResponsiveUnitWidth = function () {
                    internal.maskWidth = $(options.mask).width();
                    m = options.responsiveUnitSize($el, internal, options);
                    if ('number' !== typeof m || m < 1) {
                        throw new Error("The responsiveUnitSize callback must return a whole number greater than 0");
                    }
                    w = internal.maskWidth / m;
                    w = Math.floor(w);
                    $(options.unitElement).css('width', w);

                   
                    if (options.infinite === true && m > 0 && m !== internal.numVisibleUnits) {
                        internal.numVisibleUnits = m;

                       
                        $target.find('.clone').remove();

                       
                        $units.slice(0,internal.numVisibleUnits).clone(true).addClass('clone').appendTo($target);
                    }

                    internal.unitWidth = w;
                    internal.numVisibleUnits = m;

                },

                _imgCompute = function (el) {
                   
                    $(el).one('load' + that.instanceId, function () {
                       
                        if ($target.is(':hidden') === false || $target.is(':visible') === true) {
                            window.clearTimeout(internal.imageLoadTimer);
                            internal.imageLoadTimer = window.setTimeout(function(){
                              
                                if ($.isFunction(options.responsiveUnitSize)) {
                                    _setResponsiveUnitWidth();
                                }
                                _importWidthFromDOM();
                                that._setTargetWidth();
                                that._setArrowVisibility();
                                if ($.isFunction(options.onRedraw)) {
                                    options.onRedraw($el, internal, options);
                                }
                            },400);
                        }
                    });
                };



            if (options.unitWidth === 'inherit') {

             
                _importWidthFromDOM();


                $target.find('img').one('load' + that.instanceId, function () {
                 
                    _importWidthFromDOM();
                    that._setTargetWidth();
                    that._setArrowVisibility();
                    if ($.isFunction(options.onRedraw)) {
                        options.onRedraw($el, internal, options);
                    }

                });


            } else if (options.unitWidth === 'individual') {


              
                if ($target.is(':hidden') === false || $target.is(':visible') === true) {
                    that._setTargetWidth();
                    that._setArrowVisibility();
                }
                if ($.isFunction(options.onRedraw)) {
                    options.onRedraw($el, internal, options);
                }

              
                $target.find('img').one('load' + that.instanceId, function () {
                    if ($target.is(':hidden') === false || $target.is(':visible') === true) {
                        window.clearTimeout(internal.imageLoadTimer);
                        internal.imageLoadTimer = window.setTimeout(function(){
                            // fire the responsiveUnitSize callback
                            that._setTargetWidth();
                            that._setArrowVisibility();
                            if ($.isFunction(options.onRedraw)) {
                                options.onRedraw($el, internal, options);
                            }
                        });
                    }
                });

               
                $(window).on('resize' + that.instanceId, function () {
                    var preAdjustSlide = internal.currentSlide;

                    clearTimeout(internal.setWidthTimer);
                    internal.setWidthTimer = setTimeout(function(){
                        var adjust, d, minLeft, currLeft;

                       
                        if ($target.is(':hidden') === false || $target.is(':visible') === true) {

                            that._setTargetWidth();

                            d = $(options.unitElement).eq(preAdjustSlide).data('responsiveCarousel');
                            if (internal.lastArrowClicked === 'right') {
                                adjust = internal.maskWidth - d.right;
                            } else if (internal.lastArrowClicked === 'left' && preAdjustSlide > 0) {
                                adjust = -1 * $(options.unitElement).eq(preAdjustSlide - 1).data('responsiveCarousel').right;
                            } else {
                                adjust = 0;
                                internal.currentSlide = 0;
                            }

                            currLeft = internal.left + adjust;

                            minLeft = internal.maskWidth - internal.targetWidth;
                            if (currLeft < minLeft) {
                                adjust = minLeft;
                                internal.currentSlide = internal.numUnits -1;
                            }
                            if (currLeft > 0) {
                                adjust = 0;
                                internal.currentSlide = 0;
                            }

                            
                            $target.css({
                                left: adjust
                            });

                           
                            window.requestAnimationFrame( function () {
                                that._setArrowVisibility('_setUnitWidth individual resize');
                                if ($.isFunction(options.onRedraw)) {
                                    options.onRedraw($el, internal, options);
                                }
                            });

                        }

                    }, 400);  
                });

            } else if (options.unitWidth === 'compute') {

               
                _importWidthFromDOM();

                if ($.isFunction(options.responsiveUnitSize)) {
                    _setResponsiveUnitWidth();
                    _importWidthFromDOM();
                }
                if ($.isFunction(options.onRedraw)) {
                    options.onRedraw($el, internal, options);
                }

               
                $doms = $target.find('img');
                length = $doms.length;
                for (q = 0; q < length; ++q) {
                    _imgCompute($doms[q]);
                };

                
                $(window).on('resize' + that.instanceId, function () {
                    var preAdjustSlide = internal.currentSlide;

                    window.clearTimeout(internal.setWidthTimer);
                   
                    if ($target.is(':hidden') === false || $target.is(':visible') === true) {
                        internal.setWidthTimer = setTimeout(function(){
                            var adjust,
                                minLeft = (-1 * internal.numUnits * internal.unitWidth) + internal.maskWidth;

                            if ($.isFunction(options.responsiveUnitSize)) {
                                _setResponsiveUnitWidth();
                                _importWidthFromDOM();
                            }

                           
                            _importWidthFromDOM();
                            that._setTargetWidth();

                           
                            adjust = preAdjustSlide * -1 * internal.unitWidth;
                            
                            if (adjust < minLeft) {
                                adjust = internal.maskWidth - internal.targetWidth;
                            }

                           
                            $target.css({left: adjust});
                            that._setArrowVisibility();

                            if ($.isFunction(options.onRedraw)) {
                                options.onRedraw($el, internal, options);
                            }

                        }, 500);
                    }
                });

            } else {

                internal.unitWidth = options.unitWidth;
            }
        },

      
        _dragEvents: function () {

            var that = this,
                options = this.options,
                internal = this.internal,
                $target = $(options.target),
                $mask = $(options.mask),
                content = $target,
                startOfClones,

                hammer = new Hammer($mask.get(0), {
                    prevent_default: options.dragPreventDefault,
                    css_hacks: true,
                    drag: true,
                    drag_vertical: options.dragVertical,
                    drag_horizontal: true,
                    drag_min_distance: 0,
                    swipe: false,
                    transform: false,
                    tap: false,
                    tap_double: false,
                    hold: false
                }),
                scroll_start = {},

                getScrollPosition = function () {
                    var o = {
                        top: parseInt(content.css('top'), 10),
                        left: parseInt(content.css('left'), 10)
                    };
                    return o;
                },

                _doit = function (ev) {
                    var delta = options.delta,
                        direction = ev.direction,
                        left,
                        distance;


                    if (true === internal.isArrowBeingClicked) {
                       
                        return;
                    }

                    if (direction === 'up' || direction === 'left') {
                        ev.distance = ev.distance * -1;
                    }

                    left = scroll_start.left + ev.distance * delta;
                    distance = Math.abs(internal.scrollStart.left - left);

                    if (options.unitWidth === 'individual') {
                        if (distance > options.nudgeThreshold) {
                            if (ev.direction === 'up' || ev.direction === 'left') {
                                internal.nudgeDirection = 'left';
                            } else  {
                                internal.nudgeDirection = 'right';
                            }
                        }
                    } else {
                        if ((distance > options.nudgeThreshold) && (distance < internal.unitWidth / 2)) {
                           if (direction === 'up' || direction === 'left') {
                               internal.nudgeDirection = 'left';
                           } else {
                               internal.nudgeDirection = 'right';
                           }
                       } else if (distance <= options.nudgeThreshold) {
                           internal.nudgeDirection = 'abort';
                       } else {
                           internal.nudgeDirection = null;
                       }
                    }

                  
                    if (options.infinite === true) {
                       
                        if (left <= startOfClones) {
                            left = ev.distance * delta;
                            internal.scrollStart.left = 0;
                        }
                        if (left >= 0) {
                            left = startOfClones + ev.distance * delta;
                            internal.scrollStart.left = startOfClones;
                        }
                    }


                    internal.left = left;
                    content.css('left', left);

                };


            internal.touchObject = hammer;

            hammer.ondragstart = function () {

                
                that.stopSlideShow();

                
                window.cancelAnimationFrame(internal.dragTimer);

               
                if (options.unitWidth === 'individual') {
                  
                } else {
                    startOfClones = internal.unitWidth * (internal.numUnits - internal.numVisibleUnits) * -1;
                }

                if (true === internal.isArrowBeingClicked || true === internal.busy) {
                   
                    return {};
                }

                if(true === internal.ios6Device) {
                    internal.busy = false;
                } else {
                  
                    internal.busy = true;
                }

                scroll_start = getScrollPosition();
                scroll_start.time = new Date().getTime();


                internal.scrollStart = scroll_start;

                if ($.isFunction(options.ondragstart)) {
                    options.ondragstart(options, internal);
                }
            };

            hammer.ondrag = function (ev) {
                internal.dragTimer = window.requestAnimationFrame(
                    function () {
                        _doit(ev);
                    }
                );
            };

            hammer.ondragend = function () {

                window.cancelAnimationFrame(internal.dragTimer);

                $target.stop(true, false);
                window.requestAnimationFrame(function(){
                    that._animate($target, {left: that.computeAdjust($target)}, options.speed, function () {
                        that._setArrowVisibility();
                        internal.busy = false;
                        if ($.isFunction(options.ondragend)) {
                            options.ondragend(options, internal);
                        }
                    });
                });
            };
        },


       
        _create: function () {

           

            instanceCount = instanceCount + 1;

            var options = this.options,
                $el = $(this.element),
                $target = $(options.target);

            this.instanceId = '.carousel_' + instanceCount.toString(10);

           
            this.internal = {
                busy: false,
                currentSlide: 0,
                left: 0,
                targetWidth: 0,
                targetHeight: 0,
                maskWidth: 0,
                maskHeight: 0,
                unitWidth: 0,
                targetBackupCopy: null,
                isArrowBeingClicked: false,
                lastArrowClicked: null,
                arrowLeftVisible: true,  
                arrowRightVisible: true,
                targetLeft: 0,
                timer: null,
                dragTimer: null,
                dragEndTimer: null,
                scrollTimer: null,
                resizeTimer: null,
                firstMouseClick: false,
                prefix: null,
                slideShowActive: false,
                slideTimer: null,
                slideBumped: false,
                nudgeDirection: null,
                infinite: false,
                numUnits: null,
                numVisibleUnits: null,
                scrollStart: 0,
                touchObject: null,
                setWidthTimer: null,
                lazyloaded: false,
                ios6Device: false 

            };

           
            this.internal.backup = $target.clone(true,true);

      
            if (this.options.cssAnimations) {
                this.internal.prefix = this._getPrefix('transition');
            }

          
         	if(/(iPhone|iPod|iPad)/i.test(navigator.userAgent)) {
                if(/OS 6_/i.test(navigator.userAgent)){
                	this.internal.ios6Device = true;
                }
        	}

            this._requestAnimationFrameShim();

           
            $target.css({
                'position': 'relative',
                'left': 0
            });

           
            $target.addClass('instance-' + instanceCount);

           
            $(options.unitElement).each(function (i) {
                $(this).attr({"data-slide": i});
            });

           
            if (options.dragEvents === true) {
                this._dragEvents();
            }

          
            this._setArrowEvents();

           
            if (options.lazyload === true) {
                $(options.target).find('img.lazy-slider').lazyload({
                    effect : "fadeIn",
                    skip_invisible : false
                });
            }

          
            if ($target.is(':visible') === true || $target.is(':hidden') === false) {
                this._setUnitWidth();
                this._setTargetWidth();
                this._setArrowVisibility();
                if (options.lazyload === true) {
                    this._lazyLoad();
                }
            }


            if ($.isFunction(options.onRedraw)) {
                options.onRedraw($el, this.internal, options);
            }



        },

     
        _lazyLoad: function () {
            var internal = this.internal,
                id = this.instanceId,
                options = this.options,
                i,
                j = internal.currentSlide + internal.numVisibleUnits * 2;

            function _triggerAppear(el) {
                $(el).trigger('appear');
            }

            function _loadInitialImages() {
                var $unit,
                    $units = $(options.unitElement);

                for (i = internal.currentSlide; i < j; i = i + 1) {
                    $unit = $units.eq(i);
                    if ($unit.length) {
                        $unit.find('img.lazy-slider:not([loaded="true"])').each(function(){
                            _triggerAppear(this);
                        });
                    }
                }
            }

            function _loadAllImages() {
                var count = 0;
                $(options.target).find('img.lazy-slider:not([loaded="true"])').each(function(){
                    $(this).trigger('appear');
                    count = count + 1;
                });
            }


            function _loadScrollThresholdImages() {
                var targetTop = $(options.target).offset().top,
                    thresholdTop = $(window).scrollTop() + $(window).height() + 600,  
                    r = false;

                if (targetTop < thresholdTop) {
                    _loadAllImages();
                    r = true;
                }
                return r;
            }

    
            if (true === $.browser.msie && $.browser.version.substring(0, 2) === '8.') {
                _loadAllImages();
            } else {
              
                if (false === internal.lazyloaded) {
                   
                    _loadInitialImages();
                    $(window).on('load',function(){
                        _loadInitialImages();
                    });


                   
                    if (options.dragEvents === true) {

                     
                        if (false === _loadScrollThresholdImages()) {
                           
                            $(window).on('scroll.tempevent' + id,function(){
                                if (true === _loadScrollThresholdImages()) {
                                    $(window).unbind('scroll.tempevent' + id);
                                }
                            });
                        }

                    } else {
                      
                        $.each([$(options.target), $(options.arrowLeft), $(options.arrowRight)],function(){
                            var that = this;
                            that.on('mouseover.tempevent', function(){
                                _loadAllImages();
                                that.unbind('.tempevent');
                            });
                        });
                    }


              
                    internal.lazyloaded = true;

                }
            }
        },


 
        redraw: function () {
            var that = this,
                internal = this.internal,
                options = this.options,
                $el = $(this.element);




        
            if ($(options.target).is(":visible") || $(options.target).not(":hidden")) {
                if (this.unitWidth === undefined) {
                    this._setUnitWidth();
                }
                this._setTargetWidth();
                this._setArrowVisibility();
                if ($.isFunction(this.options.onRedraw)) {
                    that.options.onRedraw($el, internal, options);
                }
                if (options.lazyload === true){
                    that._lazyLoad();
                }
            }
        },

     
		getCurrentSlide: function () {
			return this.internal.currentSlide;
		},

   
		goToSlide: function (i,a) {
            var that = this,
                internal = this.internal,
				options = this.options,
				$target = $(options.target),
				newLeft;

            a = (a !== undefined) ? a : true;

       
            if ($target.not(":hidden"))  {
                if (this.unitWidth === undefined){
                    this._setUnitWidth();
                }

                if (options.unitWidth === 'individual') {
                    newLeft = $(options.unitElement).eq(i).data("responsiveCarousel").left;
                } else {
                    newLeft = i * internal.unitWidth * -1;
                }
    			internal.busy = true;
                if (a === true) {
                    this._animate($target, {'left': newLeft}, options.speed, function () {
                        internal.busy = false;
                        that._setArrowVisibility('goto slide');
                    });
                } else {
                    $target.css('left',newLeft);
                }
            }

		},

    
		toggleSlideShow: function () {


			var internal = this.internal;


			if (false === internal.slideShowActive) {
				this.startSlideShow();
			} else {
				this.stopSlideShow();
			}

		},

        _step: function (i) {
            var that = this,
                internal = this.internal,
                options = this.options,
                $target = $(options.target),
                width = internal.maskWidth,
                left = this._round(Math.floor($target.position().left)),
                newLeft = left + i * internal.unitWidth,
                right = left + internal.targetWidth,
                newRight = right + i * internal.unitWidth,
                adjustedLeft = newLeft;


            if (internal.slideBumped === false) {

                if (options.infinite === false) {
        
                    if (newRight <= width) {
                        adjustedLeft = newLeft + width - newRight;
                        internal.slideBumped = 'left';
                    }

          
                    if (newLeft >= 0) {
                        internal.slideBumped = 'right';
                        adjustedLeft = 0;
                    }
                }

            } else {

                if ('left' === internal.slideBumped) {
                    adjustedLeft = 0;
                }

                if ('right' === internal.slideBumped) {
                    adjustedLeft = left + width - right;
                }

                internal.slideBumped = false;

            }

       
            internal.busy = true;
            this._animate($target, {'left': adjustedLeft}, options.speed, function () {
                internal.busy = false;
                that._setArrowVisibility('_step');
            });

        },

        startSlideShow: function () {
            var that = this,
                internal = this.internal,
                options = this.options;

            if (false === internal.slideShowActive) {
                internal.slideShowActive = true;
                internal.slideTimer = window.setInterval(function () {
                    that._step(options.step);
                }, options.slideSpeed);
            }
        },

        stopSlideShow: function () {
            var internal = this.internal;

            if (true === internal.slideShowActive) {
                internal.slideShowActive = false;
                window.clearInterval(internal.slideTimer);
            }
        },

      
        _destroy: function () {
            var $target = $(this.options.target),
                $mask = $(this.options.mask);

          
            window.clearTimeout(this.internal.setWidthTimer);
            window.clearInterval(this.internal.slideTimer);
            window.clearTimeout(this.internal.scrollTimer);
            window.clearTimeout(this.internal.resizeTimer);
            window.cancelAnimationFrame(this.internal.dragTimer);
            $(window).unbind(this.instanceId);
            $(document).unbind(this.instanceId);
            $(this.options.arrowLeft).unbind(this.instanceId);
            $(this.options.arrowRight).unbind(this.instanceId);
            $target.removeClass('instance-' + instanceCount);
            $target.find('img').unbind(this.instanceId);
            if (this.internal.touchObject !== null) {
                this.internal.touchObject.destroy();
            }
            $mask.css({
                '-webkit-user-select' : '',
                '-webkit-user-drag': '',
                '-webkit-tap-highlight-color': ''
            });

            $target.replaceWith(this.internal.backup);

         
        },



       
        computeAdjust : function ($target) {


            var internal = this.internal,
                options = this.options,
                scrollStartLeft = internal.scrollStart.left,
                left = $target.position().left,
                right,
                width = internal.maskWidth,
                newLeft = 0,
                direction = internal.nudgeDirection,
                unitWidth = internal.unitWidth,
                p,
                i,
                leftFlag = false;


            function _individualGoLeft() {
                var r,
                    j,
                    d,
                    w = 0,
                    i = internal.currentSlide,
                    $units = $(options.unitElement);

                r = -1 * left + internal.maskWidth;
                j = internal.numUnits;
                while (i < j) {
                    d = $units.eq(i).data('responsiveCarousel');
                    if (r >= d.left && r <= d.right) {
                        newLeft = left - (d.right - r);
                        internal.currentSlide = i;
                        return;
                    } else {
                        w = w + d.width;
                    }
                    i = i + 1;
                }
                newLeft = left;
            }


            function _individualGoRight() {
                var l,
                    d,
                    w = 0,
                    i = internal.currentSlide,
                    $units = $(options.unitElement);

                l = Math.abs(left);
                while (i >= 0) {
                    d = $units.eq(i).data('responsiveCarousel');
                    if (l >= d.left && l <= d.right) {
                        newLeft = left + d.width;
                        if (d.right > l) {
                            newLeft = newLeft - (d.right + left);
                        }
                        internal.currentSlide = i;
                        return;
                    } else {
                        w = w + d.width;
                    }
                    i = i - 1;
                }
                newLeft = left;
            }

            if (options.unitWidth === 'individual') {
                if (direction !== null) {
                    if (direction === 'left') {
                        _individualGoLeft();

                    }
                    if (direction === 'right') {
                        _individualGoRight();
                    }
                    if (direction === 'abort') {
                        newLeft = left;
                    }
                    left = newLeft;
                    internal.nudgeDirection = null;
                }
            } else {
            
                if (direction !== null) {
                    if (direction === 'left') {
                        newLeft = scrollStartLeft - unitWidth;
                    }
                    if (direction === 'right') {
                        newLeft = scrollStartLeft + unitWidth;
                    }
                    if (direction === 'abort') {
                        newLeft = left;
                    }
                    left = newLeft;
                    internal.nudgeDirection = null;
                }
            }


            
            right = left + internal.targetWidth;
            if (right < width) {
                newLeft = left + width - right;
                left = newLeft;
            }

            
            if (left > 0) {
                left = newLeft = 0;
            }


            if (options.unitWidth !== 'individual') {
                newLeft = this._round(left);
            }



            if (isNaN(newLeft) === true) {
                newLeft = 0;
            }

            
            return newLeft;
        },

        getNumVisibleUnits : function () {
            return this.internal.numVisibleUnits;
        }

    });

}(jQuery, window, document));
