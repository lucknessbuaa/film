$(function(){
	var height = 0;
	var started = 0;
	var startY = 0;
	var offsetY = 0;
	var offset = 0;
	var total = 0;
	var config = {
		classmates: {
			party: {freq: 7, time: 5, name: '聚会'},
			KTV: {freq: 7, time: 5, name: 'KTV'},
			travel: {freq: 7, time: 6, name: '出游'},
			shopping: {freq: 7, time: 8, name: '逛街'}
		},
		friends: {
			kinsman: {freq: 5, time: 8, name: '串亲戚'},
			date: {freq: 4, time: 12, name: '相亲'},
			blabla: {freq: 7, time: 4, name: '陪七大姑聊人生'}
		},
		own: {
			mobile: {freq: 1, time: 5, name: '手机党'},
			sleep: {freq: 1, time: 8, name: '睡眠'},
			traffic: {freq: 0, time: 30, name: '春运'}
		}
	};
	var tpl = '<div class="item"><label id="$type"><input type="checkbox" class="$type" data-type="$subject">$name<span></span></label></div>';
	var url = '/api?campaignid=1';
	var track = '/audio/1.mp3';
	var audio = null;
	var played = 0;

	function init() {
		$('.page').eq(0).addClass('current');

		$('input.time#start').datetimepicker({
			lang: 'zh',
			format: 'Y-m-d',
			timepicker: false,
			closeOnDateSelect: true,
			minDate: 0,
			maxDate: '2015-03-31',
			formatDate: 'Y-m-d',
			onShow: function(ct) {
				this.setOptions({
					maxDate: $('#end').val() ? $('#end').val() : '2015-03-31'
				})
			}
		});
		$('input.time#end').datetimepicker({
			lang: 'zh',
			format: 'Y-m-d',
			timepicker: false,
			closeOnDateSelect: true,
			minDate: 0,
			maxDate: '2015-03-31',
			formatDate: 'Y-m-d',
			onShow: function(ct) {
				this.setOptions({
					minDate: $('#start').val() ? $('#start').val() : 0
				})
			}
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

		$('a, input.time, .page label, div.audio, #SOHUCS').on('touchstart MSPointerDown', touchExclude);
		$('input.time').on('change', refreshTip);
		$('.page').on('touchstart MSPointerDown', onTouchStart);
		$('.page').on('touchmove MSPointerMove', onTouchMove);
		$('.page').on('touchend MSPointerUp', onTouchEnd);
		$('.page').on('touchcancel MSPointerCancel', onTouchEnd);
		$('.page').on('touchleave MSPointerOut', onTouchEnd);
	}

	function initTrack() {
		audio = document.getElementById('bgAudio');
		audio.loop = true;
		$('div.audio').click(function(event){
			var $el = $(event.target);
			if ($el.hasClass('mute')) {
				playAudio();
			} else {
				muteAudio();
			}
		});
		if (!/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
			audio.autoplay = true;
			$('div.audio').eq(0).click();
			played = 1;
		}
	}

	function playAudio() {
		audio.play();
		$('div.audio').removeClass('mute');
	}

	function muteAudio() {
		audio.pause();
		$('div.audio').addClass('mute');
	}

	function initIOSAudio() {
		if (!played && /(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
			$('div.audio').eq(0).click();
			played = 1;
		}
	}

	function initArrangements() {
		$('.arrangement .section').each(function(index, el) {
			var subject = $(el).attr('class').replace('section', '').trim();
			if (!(subject in config)) { return; }
			for (var item in config[subject]) {
				var $item = $(tpl.replace(/\$subject/g, subject).replace(/\$type/g, item).replace(/\$name/g, config[subject][item]['name']));
				$item.appendTo($(el));
			}
		});
	}

	function refreshAttendant() {
		$.get(url, function(data) {
			try {
				var ret = JSON.parse(data);
				if (ret && 'Joinnum' in ret) {
					$('.count').text(ret.Joinnum);
					$('.attendant').css('opacity', 1);
				}
			} catch(e) {
				console.log('cannot get joinnum');
			}
		});
	}

	function refreshPage($page) {
		$('.blurin').removeClass('blurin').hide();
		if ($page.hasClass('holiday')) {
			loadHoliday();
		} else if ($page.hasClass('result')) {
			loadResult();
		} else if ($page.hasClass('film')) {
			loadFilm();
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
			if ($(el).val().trim() == '') { $(el).addClass('tip'); }
		});
	}

	function loadHoliday() {
		setTimeout(function() {$('img.ticket').addClass('blurin').show();}, 500);
		$('img.title').addClass('blurin').show();
	}

	function loadResult() {
		setTimeout(function() {$('img.parents').addClass('blurin').show();}, 500);
		$('img.children').addClass('blurin').show();
	}

	function loadFilm() {
		$('img.film_ticket').addClass('blurin').show();
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
		var high = ((number-low)/10) % 10;
		$low.text(low).removeClass('zero');
		$high.text(high);
		if (high || nozero) { 
			$high.removeClass('zero'); 
		} else {
			$high.addClass('zero');
		}
	}

	function updateTotal() {
		var start = Date.parse($('#start').val()) || 0;
		var end = Date.parse($('#end').val()) || 0;
		if (start && end && end>=start) {
			total = (end - start) / (24*60*60*1000) + 1;
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
			el.parent().find('span').text(' '+cost+'h').show();
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
		if (total) { nozero = 1; }
		updateNumber(hours, $('.hours'), nozero);
	}

	function getCurY(event) {
		return event.originalEvent.pageY || event.originalEvent.targetTouches[0].pageY;
	}

	function touchExclude(event) {
		if (!$(event.target).hasClass('audio')) {
			initIOSAudio();
		}
		// event.preventDefault();
		// event.stopPropagation();
		if ($(event.target).hasClass('time')) {
			$('.xdsoft_datetimepicker').hide();
			$(event.target)[0].focus();
			$(event.target)[0].blur();
		} else if ($(event.target).parents('#SOHUCS').length) {
			$(event.target)[0].focus();
			$(event.target).trigger('mousedown');
			$(event.target).trigger('mouseup');
			$(event.target)[0].click();
			return true;
		} else {
			$(event.target).trigger('mousedown');
			$(event.target).trigger('mouseup');
			$(event.target)[0].click();
		}
		return false;
	}

	function onTouchStart(event) {
		$('.xdsoft_datetimepicker').hide();
		console.log('start');
		event.preventDefault();
		initIOSAudio();
		if (!started) {
			startY = getCurY(event);
			started = 1;
		}
	}

	function onTouchMove(event) {
		console.log('move');
		event.preventDefault();
		if (!started) { return false; }
		var curY = getCurY(event);
		offsetY = curY - startY;
		offset += offsetY;
		startY = curY;
		$(".pagewrapper").css('top', '+='+offsetY);

		if (!$('.current').hasClass('long')) {
			var opacity = 0.9-Math.abs(offset)/height;
			opacity = opacity < 0 ? 0 : opacity;
			$(".current").css('opacity', opacity);
		}
		if (curY<=0) {
			onTouchEnd(event);
		}
		console.debug(offset);
	}

	function onTouchEnd(event) {
		console.log('end');
		event.preventDefault();
		if (!started) { return false; }
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
		if (current.hasClass('holiday') && !total) { next = current; flag = 1; }
		if (current.hasClass('long')) {
			if (offset < 0 && (height - offset) <= current.height()) {
				started = 0;
				return;
			} else if (offset < 0) {
				next = current;
				var temp = current.height() - height;
				var indexFix = temp > 0 ? temp / height : 0;
				if (indexFix) { offset = -temp; }
			}
		}

		var index = $('.page').index(next);
		if (indexFix) {
			index += indexFix;
		}
		current.removeClass('current');
		next.addClass('current');
		if (next.hasClass('result')) {
			updateRemain();
		} else if (next.hasClass('arrangement')) {
			updateAllTime();
		}
		$('.pagewrapper').animate({
			top: -Math.ceil(index*100)+'%'
		}, 'fast', function(){
			next.animate({'opacity':1});
			current.css('opacity',1);
			if (current != next) {
				refreshPage(next);
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