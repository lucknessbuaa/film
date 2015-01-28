$(function() {
	/*
	onTouchStart 处理滑动开始
	onTouchMove 处理滑动过程
	onTouchEnd 处理滑动结束

	refreshPage 处理滑动页面的刷新
	loadXXX 处理页面加载（holiday 第一页，arrangement 第二页，result 第三页，film 第四页
	*/

	var height = 0;
	var started = 0;
	var startY = 0;
	var offsetY = 0;
	var offset = 0;
	var total = 0;
	var config = {
		classmates: {
			party: {
				freq: 7,
				time: 5,
				name: '聚会'
			},
			KTV: {
				freq: 7,
				time: 5,
				name: 'KTV'
			},
			film: {
				freq: 7,
				time: 6,
				name: '看电影'
			},
			shopping: {
				freq: 7,
				time: 8,
				name: '逛街'
			}
		},
		friends: {
			kinsman: {
				freq: 5,
				time: 8,
				name: '串亲戚'
			},
			blabla: {
				freq: 7,
				time: 4,
				name: '陪七大姑聊人生'
			},
			date: {
				freq: 7,
				time: 8,
				name: '相亲'
			},
		},
		own: {
			mobile: {
				freq: 1,
				time: 5,
				name: '手机党'
			},
			sleep: {
				freq: 1,
				time: 8,
				name: '睡眠'
			},
			traffic: {
				freq: 0,
				time: 30,
				name: '春运'
			}
		}
	};
	var tpl = '<div class="item"><label id="$type"><input type="checkbox" class="$type" data-type="$subject">$name<span></span></label></div>';
	var url = '/api?campaignid=1';
	var track = '/audio/1.mp3';
	var audio = null;
	var played = 0;
	var reloadResult = 0;
	var resultFinished = 0;

	function init() {
		$('.page').eq(0).addClass('current');

		$('input.time#end').datetimepicker({
			lang: 'zh',
			format: 'Y-m-d',
			timepicker: false,
			closeOnDateSelect: true,
			minDate: 0,
			maxDate: '2015-02-28',
			formatDate: 'Y-m-d'
		});
		$('.time').change(function(event) {
			updateTotal();
		});
		initArrangements();
		refreshAttendant();
		$('.arrangement input').click(function(event) {
			updateTime($(event.target));
		});
		$('.pagewrapper').show();
		initTrack();
		loadHoliday();
		height = $('.pagewrapper').height();

		$('a, input.time, .page label, div.audio, .film textarea, .long').on('touchstart MSPointerDown', touchExclude);
		$('input.time').on('change', refreshTip);
		$('.page').on('touchstart MSPointerDown', onTouchStart);
		$('.page').on('touchmove MSPointerMove', onTouchMove);
		$('.page').on('touchend MSPointerUp', onTouchEnd);
		$('.page').on('touchcancel MSPointerCancel', onTouchEnd);
		$('.page').on('touchleave MSPointerOut', onTouchEnd);
		if (parseInt(localStorage.end)) {
			toEnd();
		}
	}

	function toEnd() {
		var index = $('.page').index($('.long'));
		$('.pagewrapper').css({
			top: -index + '00%'
		});
		localStorage.end = 0;
	}

	function initTrack() {
		audio = document.getElementById('bgAudio');
		audio.loop = true;
		$('div.audio').click(function(event) {
			var $el = $(event.target);
			if ($el.hasClass('mute')) {
				playAudio();
			} else {
				muteAudio();
			}
		});
	}

	function playAudio() {
		audio.play();
		$('div.audio').removeClass('mute');
	}

	function muteAudio() {
		audio.pause();
		$('div.audio').addClass('mute');
	}

	function initAudio() {
		if (!played) {
			$('div.audio').eq(0).click();
			played = 1;
		}
	}

	function autoSelect() {
		var selections = ['party', 'kinsman'];
		$.each(selections, function(index, value) {
			$('#' + value).trigger('click');
		});
	}

	function initArrangements() {
		$('.arrangement .section').each(function(index, el) {
			var subject = $(el).attr('class').replace('section', '').trim();
			if (!(subject in config)) {
				return;
			}
			for (var item in config[subject]) {
				var $item = $(tpl.replace(/\$subject/g, subject).replace(/\$type/g, item).replace(/\$name/g, config[subject][item]['name']));
				$item.appendTo($(el));
			}
		});
		autoSelect();
	}

	function refreshAttendant() {
		$.get(url, function(data) {
			try {
				var ret = JSON.parse(data);
				if (ret && 'Joinnum' in ret) {
					$('.count').text(ret.Joinnum);
					$('.attendant').css('opacity', 1);
				}
			} catch (e) {
				console.log('cannot get joinnum');
			}
		});
	}

	function stopFilm($page) {
		$('.film .attendant').velocity('stop').css({
			opacity: 0,
			bottom: '0px'
		});
		$('.film .wrapper').velocity('stop').css('opacity', 0);
		$(".film .guide div.first").velocity('stop').css({
			top: '0px',
			opacity: 0
		});
		$(".film .guide div.second").velocity('stop').css({
			top: '25px',
			opacity: 0
		});
		$(".film .guide div.third").velocity('stop').css({
			top: '50px',
			opacity: 0
		});
		$(".film .guide div").show();
		$(".film .cinima").velocity('stop').css('opacity', 0);
	}

	function refreshPage($page, $prev) {
		$('.blurin').removeClass('blurin').hide();
		$('.slipin').removeClass('slipin').hide();
		$('.slipup').removeClass('slipup').hide();
		$('.sliplb').removeClass('sliplb').hide();
		$('.fadein').removeClass('fadein').hide();
		$('.fadeup').removeClass('fadeup').hide();
		$('.bubbleL').removeClass('bubbleL').hide();
		$('.bubbleR').removeClass('bubbleR').hide();
		$('.flip').removeClass('flip');

		if ($prev.hasClass('film')) {
			stopFilm($prev);
		}

		if ($page.hasClass('holiday')) {
			loadHoliday();
		} else if ($page.hasClass('result')) {
			loadResult();
		} else if ($page.hasClass('film')) {
			loadFilm();
		}
	}

	function reloadPage($page) {
		if ($page.hasClass('result') && reloadResult) {
			loadResult();
		}
	}

	function refreshTip(event) {
		var $el = $(event.target);
		if ($el.val().trim() == '') {
			$el.addClass('tip');
		} else {
			$el.removeClass('tip');
		}
	}

	function showTip() {
		$('input.time').each(function(index, el) {
			if ($(el).val().trim() == '') {
				$(el).addClass('tip');
			}
		});
	}

	function loadHoliday() {
		setTimeout(function() {
			$('img.title').addClass('blurin').show();
		}, 100);
		setTimeout(function() {
			$('.endinput').addClass('slipin').show();
		}, 300);
		setTimeout(function() {
			$('.statistic').addClass('slipin').show();
		}, 800);
		setTimeout(function() {
			$('.people').addClass('slipup').show();
		}, 1300);
		setTimeout(function() {
			$('.ticket').addClass('sliplb').show();
		}, 1800);
	}

	function loadResult() {
		if (!reloadResult) {
			setTimeout(function() {$('.above-remain').addClass('slipin').show();}, 100);
			setTimeout(function() {$('.remain').addClass('slipin').show();}, 500);
			setTimeout(function() {$('span.replace').text('你很忙'); $('.below-remain').addClass('slipin').show();}, 900);
			
			setTimeout(function() {$('.children_0').addClass('fadein').show();}, 1400);
			setTimeout(function() {$('.parents_0').addClass('fadeup').show();}, 1700);

			setTimeout(function() {$('.sentence00').addClass('bubbleL').show();}, 2000);
			setTimeout(function() {$('.sentence01').addClass('bubbleL').show();}, 2200);
			setTimeout(function() {$('.sentence02').addClass('bubbleL').show();}, 2300);
			setTimeout(function() {$('.sentence03').addClass('bubbleR').show(); resultFinished = 1;}, 2500);
		} else if (reloadResult == 1 && resultFinished) {
			resultFinished = 0;
			setTimeout(function() {
				$('.children_0').fadeOut('slow');
				$('.parents_0').fadeOut('slow');
				$('.sentence').fadeOut('slow');
			}, 100);
			setTimeout(function() {$('span.replace').fadeOut('slow', function() {
				$('span.replace').text('时间很短');
				$('span.replace').fadeIn();
			});}, 500);

			setTimeout(function() {if(!reloadResult) return; $('.children_1').addClass('fadein').show();}, 800);
			setTimeout(function() {if(!reloadResult) return; $('.parents_1').addClass('fadeup').show();}, 1300);

			setTimeout(function() {if(!reloadResult) return; $('.sentence10').addClass('bubbleL').show();}, 1700);
			setTimeout(function() {if(!reloadResult) return; $('.sentence11').addClass('bubbleR').show();}, 1900);
			reloadResult = 2;
		}
	}

	function loadFilm() {
		$(".film .cinima").css({
			bottom: '17%'
		});

		async.parallel([
			function(callback) {
				$(".film .cinima").velocity({
					bottom: '20%',
					opacity: 1
				}, {
					duration: 500,
					easing: 'ease-out',
					complete: function() {
						callback(null);
					}
				});
			},
			function(callback) {
				$('.guide div.first').velocity({
					top: '5px',
					opacity: 1,
				}, {
					delay: 500,
					easing: 'ease-out',
					duration: 'fast',
					complete: function() {
						console.log('first complete');
						callback(null);
					}
				});
			},
			function(callback) {
				$('.guide div.second').velocity({
					top: '30px',
					opacity: 1
				}, {
					duration: 'fast',
					easing: 'ease-out',
					delay: 1000,
					complete: function() {
						console.log('second complete');
						callback(null);
					}
				});
			},
			function(callback) {
				$('.guide div.third').velocity({
					top: '55px',
					opacity: 1
				}, {
					duration: 'fast',
					easing: 'ease-out',
					delay: 1500,
					complete: function() {
						console.log('third complete');
						callback(null);
					}
				});
			}
		], function() {
			$('.film .attendant').velocity({
				opacity: 1,
				bottom: '10px'
			}, {
				duration: 'fast',
				easing: 'ease-out',
				complete: function() {
					$('.guide div').velocity({
						opacity: 0
					}, {
						duration: 1000,
						delay: 500,
						easing: 'ease-out',
						complete: function() {
							$('.guide div').hide();
							$('.wrapper').velocity({
								opacity: 1
							}, {
								duration: 1000,
								easing: 'ease-out',
								complete: function() {
									$('.film img.film_ticket').addClass('blurin').show();
								}
							});
						}
					});
				}
			});
		});
	}

	function updateNumber(number, $el, nozero) {
		var $high = $el.find('.high');
		var $low = $el.find('.low');
		if (!number && !nozero) {
			$high.text('0').addClass('zero');
			$low.text('0').addClass('zero');
			return;
		}
		var low = number % 10;
		var high = ((number - low) / 10) % 10;
		$low.text(low).removeClass('zero');
		$high.text(high);
		if (high || nozero) {
			$high.removeClass('zero');
		} else {
			$high.addClass('zero');
		}
	}

	function updateTotal() {
		var start = new Date();
		var end = Date.parse($('#end').val()) || 0;
		if (end) {
			end += 24 * 3600000 + start.getTimezoneOffset() * 60000;
		}
		if (end && end >= start) {
			total = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
		} else {
			total = 0;
		}
		updateNumber(total, $('.total'));
	}

	function updateTime(el) {
		var parent = el.data('type');
		var item = {};
		var cost = 0;
		if (total) {
			try {
				item = config[parent][el.attr('class')];
			} catch (e) {
				console.warn('unknown item');
			}
			if (item['freq']) {
				cost = Math.ceil(item['time'] * total / item['freq']) || 0;
			} else {
				cost = item['time'] || 0;
			}
			el.parent().find('span').text(' ' + cost + 'h').show();
		} else {
			el.parent().find('span').text('').hide();
		}
		if (el.is(':checked')) {
			el.parent().addClass('checked');
		} else {
			el.parent().removeClass('checked');
		}
		return cost;
	}

	function updateAllTime() {
		$('.item input[type=checkbox]').each(function(index, el) {
			updateTime($(el));
		});
	}

	function updateRemain() {
		if (!total) {
			updateNumber(0, $('.days'));
			updateNumber(0, $('.hours'));
			return;
		}
		var cost = 0;
		var remain = 24 * total;
		$('.item input[type=checkbox]:checked').each(function(index, el) {
			cost += updateTime($(el));
		});
		remain = remain - cost;
		if (remain < 0) {
			remain = 0;
		}
		var hours = remain % 24;
		var days = (remain - hours) / 24;
		updateNumber(days, $('.days'));
		var nozero = 0;
		if (total) {
			nozero = 1;
		}
		updateNumber(hours, $('.hours'), nozero);
	}

	function getCurY(event) {
		return event.originalEvent.pageY || event.originalEvent.targetTouches[0].pageY;
	}

	function debug(text) {
		console.log(text);
		console.log(offset);
		var content = text + '##' + offset + '####' + Math.random();
		// $('.debug').text(content);

		if ($('.current').hasClass('long')) {
			if (text == 'exclude') {
				// $('.debug').text($('.current').attr('class'));
			}
			// $('.debug').text(text+'=>'+started+'#startY '+startY+'#offsetY '+offsetY+'#offset '+offset);
		}
	}

	function march($target, actions) {
		for (var i = 0; i < actions.length; i++) {
			var action = actions[i];
			try {
				switch (action) {
					case 'focus':
					case 'blur':
					case 'click':
						$target[0][action]();
						break;
					case 'mousedown':
					case 'mouseup':
						$target.trigger(action);
						break;
					default:
						console.log('i know nothing');
				}
			} catch (e) {
				console.log(action + " is not supported");
			}
		}
	}

	function touchExclude(event) {
		debug('exclude');
		// event.preventDefault();
		// event.stopPropagation();
		var $target = $(event.target);
		if ($target.hasClass('time')) {
			$('.xdsoft_datetimepicker').hide();
			march($target, ['focus', 'blur']);
		} else if ($('.current').hasClass('long')) {
			march($target, ['focus', 'mousedown', 'mouseup', 'click']);
			return true;
		} else {
			march($target, ['focus', 'mousedown', 'mouseup', 'click']);
		}
		return false;
	}

	function onTouchStart(event) {
		debug('start');
		$('.xdsoft_datetimepicker').hide();
		event.preventDefault();
		if (!started) {
			startY = getCurY(event);
			started = 1;
		}
	}

	function onTouchMove(event) {
		debug('move');
		event.preventDefault();
		if (!started) {
			return false;
		}
		var curY = getCurY(event);
		offsetY = curY - startY;
		offset += offsetY;
		startY = curY;
		if (!($('.current').hasClass('result') && reloadResult != 2)) {
			$(".pagewrapper").css('top', '+=' + offsetY);

			if (!$('.current').hasClass('long')) {
				var opacity = 0.9 - Math.abs(offset) / height;
				opacity = opacity < 0 ? 0 : opacity;
				$(".current").css('opacity', opacity);
			}
		}

		if (curY <= 0) {
			onTouchEnd(event);
		}
	}

	function onTouchEnd(event) {
		debug('end');
		event.preventDefault();
		if (!started) {
			return false;
		}
		var current = $('.current');
		var next = current;
		var flag = 0;

		if (Math.abs(offset) <= Math.abs(offsetY)) {
			offsetY = 0;
		}

		if (offsetY < 0) {
			next = current.next('.page');
			next = next.length === 1 ? next : current;
		} else if (offsetY > 0) {
			next = current.prev('.page');
			next = next.length === 1 ? next : current;
		}

		if (current.hasClass('holiday') && !total) {
			next = current;
			flag = 1;
		}
		if (current.hasClass('result') && next.hasClass('film') && reloadResult != 2) {
			next = current;
			reloadResult = 1;
		} else if (current.hasClass('result') && reloadResult == 2) {
			reloadResult = 0;
		}
		if (current.hasClass('long')) {
			if ($('#ds-wrapper').length) {
				next = current;
			}
			if (offset < 0 && (height - offset) <= current.height()) {
				started = 0;
				return;
			} else if (offset < 0) {
				next = current;
				var temp = current.height() - height;
				var indexFix = temp > 0 ? temp / height : 0;
				if (indexFix) {
					offset = -height * Math.floor(indexFix * 100) / 100;
				}
			}
		}

		var index = $('.page').index(next);
		if (indexFix) {
			index += indexFix;
		}
		current.removeClass('current');
		next.addClass('current');
		localStorage.end = 0;
		if (next.hasClass('result')) {
			updateRemain();
		} else if (next.hasClass('arrangement')) {
			initAudio();
			updateAllTime();
		} else if (next.hasClass('long')) {
			localStorage.end = 1;
		}

		$('.pagewrapper').animate({
			top: -Math.floor(index * 100) + '%'
		}, 'fast', function() {
			next.animate({
				'opacity': 1
			});
			current.css('opacity', 1);
			if (current != next) {
				refreshPage(next, current);
			} else {
				reloadPage(next);
			}
			if (flag) {
				showTip();
			}
		});
		started = 0;
		if (!indexFix) {
			startY = 0;
			offset = 0;
		}
	}

	init();
});

// wx.config({
// 	debug: true,
// 	appId: '',
// 	timestamp: ,
// 	nonceStr: '',
// 	signature: '',
// 	jsApiList: []
// });
