$(function(){
	var height = 0;
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
	var tpl = '<div class="item"><label><input type="checkbox" class="$type" data-type="$subject">$name</label><span></span></div>';

	function init() {
		$('.page').eq(0).addClass('current');

		$('#dtBox').DateTimePicker({
			shortMonthNames: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
			formatHumanDate: function(date) {return date.monthShort + " " + date.dd + ", " + date.yyyy;},
			dateFormat: "yyyy-MM-dd"
		});
		$('.time').change(function(event) {
			updateTotal();
		});
		initArrangements();
		$('.arrangement input').click(function(event) {
			updateTime($(event.target));
		});
		$('.pagewrapper').show();
		loadHoliday();
		height = $('.pagewrapper').height();

		$('a, input.time, .page label, #dtBox').on('touchstart MSPointerDown', touchExclude);
		$(document).on('touchstart MSPointerDown', onTouchStart);
		$(document).on('touchmove MSPointerMove', onTouchMove);
		$(document).on('touchend MSPointerUp', onTouchEnd);
	}

	function initArrangements() {
		$('.arrangement .section').each(function(index, el) {
			var subject = $(el).attr('class').replace('section', '').trim();
			if (!(subject in config)) { return; }
			for (var item in config[subject]) {
				var $item = $(tpl.replace('$subject', subject).replace('$type', item).replace('$name', config[subject][item]['name']));
				$item.appendTo($(el));
			}
		});
	}

	function refreshPage($page) {
		$('.blurin').removeClass('blurin').hide();
		if ($page.hasClass('holiday')) {
			loadHoliday();
		} else if ($page.hasClass('result')) {
			loadResult();
		}
	}

	function loadHoliday() {
		setTimeout(function() {$('img.ticket').addClass('blurin').show();}, 500);
		$('img.title').addClass('blurin').show();
	}

	function loadResult() {
		setTimeout(function() {$('img.parents').addClass('blurin').show();}, 500);
		$('img.children').addClass('blurin').show();
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
		if (total && el.is(':checked')) {
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
			el.parent().siblings('span').text(cost+'小时').show();
		} else {
			el.parent().siblings('span').text('').hide();
		}
		return cost;
	}

	function updateAllTime() {
		$('.item input[type=checkbox]:checked').each(function(index, el) {
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
		if (days) { nozero = 1; }
		updateNumber(hours, $('.hours'), nozero);
	}

	function getCurY(event) {
		return event.originalEvent.pageY || event.originalEvent.targetTouches[0].pageY;
	}

	function touchExclude(event) {
		if ($(event.target).hasClass('time')) {
			$(event.target)[0].focus();
		} else {
			$(event.target)[0].click();
		}
		event.preventDefault();
		event.stopPropagation();
		return false;					
	}

	function onTouchStart(event) {
		event.preventDefault();
		if (!startY) {
			startY = getCurY(event);
		}
	}

	function onTouchMove(event) {
		event.preventDefault();
		if (!startY) { return false; }
		var curY = getCurY(event);
		offsetY = curY - startY;
		offset += offsetY;
		startY = curY;
		$(".pagewrapper").css('top', '+='+offsetY);

		var opacity = 0.8-Math.abs(offset)/height;
		opacity = opacity < 0 ? 0 : opacity;
		$(".current").css('opacity', opacity);
	}

	function onTouchEnd(event) {
		event.preventDefault();
		if (!startY) { return false; }
		var current = $('.current');
		var next = current;

		if (Math.abs(offset) <= Math.abs(offsetY)) {
			offsetY = 0;
		}

		if (offsetY < 0) {
			next = current.next();
			next = next.length === 1 ? next : current;
		} else if (offsetY > 0) {
			next = current.prev();
			next = next.length === 1 ? next : current;
		}
		var index = $('.page').index(next);
		current.removeClass('current');
		next.addClass('current');
		if (next.hasClass('result')) {
			updateRemain();
		} else if (next.hasClass('arrangement')) {
			updateAllTime();
		}
		$('.pagewrapper').animate({
			top: -index+'00%'
		}, 'fast', function(){
			current.css('opacity',1);
			refreshPage(next);
		});
		startY = 0;
		offset = 0;
	}

	init();
});