$(function(){
	var width = 0;
	var startX = 0;
	var offsetX = 0;
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
		$('.page').each(function(index, el) {
			$(el).css('left', index+'00%');
		});
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
		width = $('.pagewrapper').width();

		$('a, input.time, .page label, #dtBox').on('touchstart MSPointerDown', touchExclude);
		$('.pagewrapper').on('touchstart MSPointerDown', onTouchStart);
		$('.pagewrapper').on('touchmove MSPointerMove', onTouchMove);
		$('.pagewrapper').on('touchend MSPointerUp', onTouchEnd);
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

	function updateTotal() {
		var start = Date.parse($('#start').val()) || 0;
		var end = Date.parse($('#end').val()) || 0;
		if (start && end && end>=start) {
			total = (end - start) / (24*60*60*1000) + 1;
			$('.total').text(total);
		} else {
			total = 0;
			$('.total').text('?');
		}
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
			$('.days').text('?');
			$('.hours').text('?');
			$('.numerator').text('?');
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
		$('.days').text(days);
		$('.hours').text(hours);
		if (hours) { days++; }
		$('.numerator').text(days);
	}

	function getCurX(event) {
		return event.originalEvent.pageX || event.originalEvent.targetTouches[0].pageX;
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
		if (!startX) {
			startX = getCurX(event);
		}
	}

	function onTouchMove(event) {
		event.preventDefault();
		if (!startX) { return false; }
		var curX = getCurX(event);
		offsetX = curX - startX;
		offset += offsetX;
		startX = curX;
		$(".pagewrapper").css('left', '+='+offsetX);
	}

	function onTouchEnd(event) {
		event.preventDefault();
		if (!startX) { return false; }
		var current = $('.current');
		var next = current;

		if (Math.abs(offset) <= Math.abs(offsetX)) {
			offsetX = 0;
		}

		if (offsetX < 0) {
			next = current.next();
			next = next.length === 1 ? next : current;
		} else if (offsetX > 0) {
			next = current.prev();
			next = next.length === 1 ? next : current;
		}
		var index = $('.page').index(next);
		var left = index * width;
		current.removeClass('current');
		next.addClass('current');
		if (next.hasClass('result')) {
			updateRemain();
		} else if (next.hasClass('arrangement')) {
			updateAllTime();
		}
		$('.pagewrapper').animate({
			left: -left
		}, 'fast');
		startX = 0;
		offset = 0;
	}


	init();
});