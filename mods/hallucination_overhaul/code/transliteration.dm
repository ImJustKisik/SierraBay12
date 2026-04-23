// English to Russian transliteration utility

/proc/transliterate_en2ru(text)
	if(!istext(text) || !length(text))
		return text


	var/static/list/digraph_upper = list(
		"Shch" = "Щ",
		"shch" = "щ",
		"Sh" = "Ш", "sh" = "ш",
		"Ch" = "Ч", "ch" = "ч",
		"Th" = "Т", "th" = "т",
		"Ph" = "Ф", "ph" = "ф",
		"Zh" = "Ж", "zh" = "ж",
		"Kh" = "Х", "kh" = "х",
		"Ts" = "Ц", "ts" = "ц",
		"Yu" = "Ю", "yu" = "ю",
		"Ya" = "Я", "ya" = "я",
		"Yo" = "Ё", "yo" = "ё",
		"Ye" = "Е", "ye" = "е"
	)


	var/static/list/char_map = list(
		"A" = "А", "a" = "а",
		"B" = "Б", "b" = "б",
		"C" = "К", "c" = "к",
		"D" = "Д", "d" = "д",
		"E" = "Е", "e" = "е",
		"F" = "Ф", "f" = "ф",
		"G" = "Г", "g" = "г",
		"H" = "Х", "h" = "х",
		"I" = "И", "i" = "и",
		"J" = "Дж", "j" = "дж",
		"K" = "К", "k" = "к",
		"L" = "Л", "l" = "л",
		"M" = "М", "m" = "м",
		"N" = "Н", "n" = "н",
		"O" = "О", "o" = "о",
		"P" = "П", "p" = "п",
		"Q" = "К", "q" = "к",
		"R" = "Р", "r" = "р",
		"S" = "С", "s" = "с",
		"T" = "Т", "t" = "т",
		"U" = "У", "u" = "у",
		"V" = "В", "v" = "в",
		"W" = "В", "w" = "в",
		"X" = "Кс", "x" = "кс",
		"Y" = "Й", "y" = "й",
		"Z" = "З", "z" = "з"
	)

	var/result = ""
	var/i = 1
	var/text_len = length_char(text)

	while(i <= text_len)
		var/matched = FALSE


		for(var/check_len in list(4, 2))
			if(i + check_len - 1 > text_len)
				continue
			var/chunk = copytext_char(text, i, i + check_len)
			if(digraph_upper[chunk])
				result += digraph_upper[chunk]
				i += check_len
				matched = TRUE
				break

		if(matched)
			continue


		var/char = copytext_char(text, i, i + 1)
		if(char_map[char])
			result += char_map[char]
		else
			result += char // preserve spaces, digits, punctuation, cyrillic, etc.
		i++

	return result
