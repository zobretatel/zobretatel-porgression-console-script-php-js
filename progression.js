
// Пояснения пользователю

console.log("")
console.log("******************************************************************")
console.log("")
console.log("Введите последовательность чисел через запятую , являющуюся")
console.log("арифметической , геометрической прогрессией , либо")
console.log("произвольный набор чисел .")
console.log("")
console.log("******************************************************************")
console.log("")
console.log("")

// Берём пользовательский ввод с клавиатуры

let stdin = process.openStdin() ; stdin.addListener("data", function($user_input) { $user_input = $user_input.toString().trim()

// Кладём элементы в массив

$arr = $user_input.split(',')

// Не слишком ли мало значений введено

if( $arr.length < 3 ){
	console.log( "   Введённая последовательность слишком короткая , нечего анализировать \r\n")
	process.exit()
}

// Очищаем элементы от возможных пробелов ,
// заодно проверяем , всё-ли что ввели - числа ,
// если не число - выдаём сообщение и прерываем программу

for( $key=0 ; $key<$arr.length ; $key++ ) { $val = $arr[$key]
	$newval = $val.trim()
	if( !isNaN($newval) ){
		$arr[$key] = $newval
	}
	else{
		//echo "   Введённое Вами значение <<< $newval >>> не является числом \r\n"
		console.log( "   Введённое Вами значение не является числом ---> "+$newval +"\r\n")
		process.exit()
	}
}

// Определяем дельту для арифметической и геометрической прогрессий

$arithmetic_delta = $arr[1] - $arr[0]
$geometric_delta  = $arr[1] / $arr[0]

// Теперь проверяем , соответствуют ли введённые значения
// правилам арифметической и геометрической прогрессии

// Флаги результатов проверки

$flag_arithmetic_progression = true
$flag_geometric_progression  = true

// Прокручиваем массив с первого до предпоследнего элемента
// и берём элементы попарно для сравнения ,
// в случае расхождения с ранее вычисленной дельтой
// сбрасываем соответствующий флаг

for( $i=0 ; $i<$arr.length-1 ; $i++ ){
	$a_delta = $arr[$i+1] - $arr[$i]
	if( $a_delta !== $arithmetic_delta ){
		$flag_arithmetic_progression = false
	}
	$g_delta = $arr[$i+1] / $arr[$i]
	if( $g_delta !== $geometric_delta ){
		$flag_geometric_progression = false
	}
}

// Вводим результаты

if( $flag_arithmetic_progression ){
	console.log( "   Введённая последовательность является арифметической прогрессией с шагом "+$arithmetic_delta +"\r\n")
}
else{
	console.log( "   Введённая последовательность не является арифметической прогрессией \r\n")
}

if( $flag_geometric_progression ){
	console.log( "   Введённая последовательность является геометрической прогрессией с коэффициентом "+$geometric_delta +"\r\n")
}
else{
	console.log( "   Введённая последовательность не является геометрической прогрессией \r\n")
}





process.exit() })
