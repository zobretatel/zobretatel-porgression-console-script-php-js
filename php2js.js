
//
// протестировано с node.js -v 6.9.1
// на выходе получается рабочий progression.js
//

// подключаем модуль для работы с файловой системой
let fs = require("fs")

// читаем весь файл и сразу разбиваем его на строки и помещаем в массив ,
// странная на первый взгляд конструкция split().join().split().join().split
// служит для унификации разбиения , в случае различных символов окончания строк ( win | nix | mac )
let line = fs.readFileSync( 'progression.php' , 'utf8' ).split("\r\n").join("\n").split("\r").join("\n").split("\n")

// здесь будет итоговый вывод (массив строк выходного javascript)
let out = new Array()

// возможные режимы анализа строки
const modeUNKNOWN    = -20  // режим анализа неизвестен
const modeCOMMENT    = -10	// строка комментария начинающаяся с //
const modeSTDIN      = -8   // особая строка содержащая код для стандартного ввода
const modeEMPTYLINE  = 0	// пустая строка
const modeSIMPLELINE = 10	// 'простая строка'
const modePHPMARKING = 20	// <?php и ?>
const modeLONGECHO   = 30	// конструкция echo для вывода многострочной строки
const modeECHO       = 40	// простое echo

// некоторые переменные используемые в дальнейшем анализе
let tabs               // количество начальных символов табуляции в строке
let tabsline           // строка начальных табуляций
let trimline           // строка очищенная от лишний пробельных символов , т.е. подготовленная к анализу
let mode = modeUNKNOWN // текущий режим анализа строки , изначально неизвестен
let longechoend = ''   // символ окончания многострочного echo , пока не знаем какой
let str2               //
let str3               //
let str4               // 2 | 3 | 4 начальный символа строки trimline
let couple             // пожалуй , пары начальных символов строки trimline нам хватит , чтобы понять 'суть' строки
let pos                // используется эпизодически , как указатель позиции каких-либо символов

// начинаем прокручивать массив php строк и преобразуем каждую в её аналог на javascript
for( let i=0 ; i<line.length ; i++ ){

	// первоначальная подготовка , общая для всех строк
	// удаление лишний пробельных символов , точек с запятой

	// начальные символы табуляции для анализа только помеха , но сохраним их количество
	tabs = line[i].lastIndexOf("\t")
	// строка для анализа
	trimline = line[i].trim()
	// вырезаем хвостовые точки с запятой , в js они не нужны, а здесь затрудняют анализ
	pos = trimline.lastIndexOf(';')
	if( pos === trimline.length-1 ){
		trimline = trimline.substr(0,trimline.length-1)
	}
	// превращаем задвоившиеся маркеры спецсимволов (типа \\r\\n) обратно в одинарные
	//trimline = trimline.replace( '\\\\' , '\\' )
	//trimline = trimline.replace(/\\/g,"\\")
	
	// особый случай - мы уже в режиме трансляции строк многострочного echo
	if( mode === modeLONGECHO ){
		//console.log( 'LONGECHO [' + longechoend + '] === ' + trimline )
		
		// проверяем , не является ли строка - маркером окончания многострочного режима
		if( trimline === longechoend ){
			// выходим из режима и переходим к следующей строке
			mode = modeUNKNOWN
			continue
		}
		// не маркер , транслируем - оборачиваем каждую строку в console.log ...
		out.push( 'console.log("'+trimline+'")' )
		
	}
	// мы не в многострочном режиме modeLONGECHO , значит ведём анализ и трансляцию каждой строки
	else{
		// два начальных символа для анализа 'сути' строки
		couple = trimline.substr(0,2)
		//console.log( tabsline + ' :: [' + couple + '] ==== ' + trimline )
		
		// устанавливаем в зависимости от начальной пары символов
		// режим дальнейшей трансляции строки
		// ( можно было бы проводить трансляцию и сразу здесь ,
		//   но разбиение на два этапа немного улучшит читаемость кода )
		switch( couple ){
			
			case '<?' :
			case '?>' :
				mode = modePHPMARKING
			break
			
			case '$u' :
				mode = modeSTDIN
			break
					
			case 'ec' : // у нас 'echo' , вот только какое ? многострочное или обычное , дальше анализируем
				if( trimline.substr(4,3) === '<<<' ){
					// мы в мультистроковом echo , определим маркер окончания мультистрочки
					longechoend = trimline.substr(7)
					// установим режим и перейдём сразу к следующей строке
					mode = modeLONGECHO
					continue
				}
				else{
					// у нас обычное echo
					mode = modeECHO
				}
			break
			
			/*
			case '//' :
				mode = modeCOMMENT
			break
			*/
			
			default   : mode = modeUNKNOWN
			
		}
		
		// анализ произведён , восстанавливаем табуляции в начале строки
		tabsline = '' ; for( let t=0 ; t<(tabs+1) ; t++ ) tabsline += "\t"
		trimline = tabsline + trimline
		
		// в соответствии с установленным режимом
		// производим трансляцию строки php в строку javascript
		switch( mode ){
			
			case modeUNKNOWN : // в неопределённом режим анализа , переносим строку преобразуя возможные функции
			
				//console.log( ' M O D E U N K N O W N ' )
				// небольшой хак , чтобы не заморачиваться в дальнейшем с извлечением аргументов
				// для особого случая , когда есть последовательность ',' , просто временно
				// подменим её , а потом вернём
				trimline = trimline.replace( "','" , "|||" )
				trimline = cycPHP2JS( funsPHP2JS( trimline ) )
				trimline = trimline.replace( "|||" , "','" )
				out.push( trimline )
			break
			
			case modeSTDIN   : // особый случай , строка стандартного ввода , просто заменим её на заготовленную
				out.push( 'let stdin = process.openStdin() ; stdin.addListener("data", function($user_input) { $user_input = $user_input.toString().trim()' )
			break
			
			case modeCOMMENT : // комментарии переносим как есть
				out.push( trimline )
			break
			
			case modeECHO    : // echo заменяем на console.log( ... )
				//out.push( trimline.replace( 'echo ' , 'console.log(' ) + ')' )
				// если внутри строки есть переменные ( $variable )
				// то преобразуем это в конкатенацию строк
				//pos = trimline.indexOf( '$' )
				//if( pos === -1 ){
				//	
				//}
				trimline = trimline.replace(/\$.* /g,'"\+$&\+"').replace( 'echo' , 'console.log(') + ')'
				out.push( trimline )
			break
			
		}
	
	}	
}



// последняя строка
// для завершения работы и закрытия callback функции стандартного ввода
out.push( 'process.exit() })' )


//console.log( "\r\n\r\n" )
//console.log( out )



// производим вывод строк в файл
fs.open( 'progression.js' , 'w' , 0644 , function(err, file_handle) {
	if (!err) {
	    fs.write( file_handle , out.join("\r\n")+"\r\n" , null, 'ascii' )
	}
})



// транслируем функции php в js
function funsPHP2JS( line ){
	
	// набор трансляций
	// где :
	// signature    - оригинальная сигнатура поиска
	// newsignature - сигнатура замены
	// mode         - режим замены : fun2obj = функция на объект | sig2new = замена искомой сигнатуры на новую
	// flgfun       - важен для режима fun2obj , показывает , будет ли в результате замены метод(функция) или свойство
	// arg2obj      - важен для режима fun2obj , указывает , как аргумент функции превращать в объект , нумерация начинается с 1
	let translate = [
		{ signature : 'count'      , newsignature : 'length'    , mode : 'fun2obj'   , flgfun : false ,   arg2obj : 1 } ,
		{ signature : 'split'      , newsignature : 'split'     , mode : 'fun2obj'   , flgfun : true  ,   arg2obj : 2 } ,
		{ signature : 'trim'       , newsignature : 'trim'      , mode : 'fun2obj'   , flgfun : true  ,   arg2obj : 1 } ,
		{ signature : 'is_numeric' , newsignature : '!isNaN'    , mode : 'sig2new'   , flgfun : false  ,   arg2obj : -1 } ,
		{ signature : 'exit'       , newsignature : 'process.exit()' , mode : 'sig2new' , flgfun : false , arg2obj : -1 }
		
		
	]
	
	// пробуем выполнить все возможные трансляции
	//console.log( '========================================================================' )
	//console.log( line )
	//console.log( '------------------------------------------------------------------------' )
	translate.forEach( function( t ){
		//console.log( line = funPHP2objJS( line , t.signature , t.newsignature , t.mode , t.flgfun , t.arg2obj ) )
		line = funPHP2objJS( line , t.signature , t.newsignature , t.mode , t.flgfun , t.arg2obj )
	})
	
	return line
}



// трансляция строки с функцией PHP в объектный аналог javascript
// line         - входная строка
// signature    - сигнатура (имя) искомой функции
// newsignature - имя функции подмены
// arg2obj      - номер аргумента внутри искомой функции , который станет объектом
function funPHP2objJS( line , signature , newsignature , mode , flagfunction , arg2obj = 1 ){
	// определяем , есть ли искомая сигнатура (функция)
	let pos = line.indexOf( signature )
	// нет - сразу на выход
	if( pos === -1 ){
		return line
	}
	// есть - попробуем преобразовать
	
	// шаг 1ый - определяем границы транслируемой подстроки , как --- signature( ...something... )
	let posOpen  = line.indexOf( '(' , pos+1 )
	let posClose = line.indexOf( ')' , posOpen+1 )
	
	// шаг 2ой - вырезаем строку аргументов
	let argsline = line.substring( posOpen+1 , posClose )
	
	// шаг 3ий - получаем сами аргументы
	let args = argsline.split(',')
	// очищаем от ненужных пробелов
	args.forEach( function( item , ind , args ){
		args[ind] = item.trim()
	})
	
	// шаг 4ый - берём тот аргумент , который становится объектом
	let obj = args[ arg2obj-1 ]
	
	// шаг 5ый - вырезаем его из массива аргументов
	args.splice( arg2obj-1 , 1 )
	
	// шаг 6ой - наконец конструируем подстроку замены
	let objline = ''
	if( mode === 'fun2obj' ){
		objline = obj + '.' + newsignature
		if( flagfunction ){
			objline += '(' + args.join( ',') + ')'
		}
	}else if( mode === 'sig2new' ){
		return line.replace( signature , newsignature )
	}
	
	// шаг 7ой - производим замещение во входной строке
	line = line.substring(0,pos) + objline + line.substring(posClose+1)
	
	//return '<<< ('+argsline+') === '+objline+' >>>'
	return line
}



// транслируем циклы ( у нас только foreach нуждается в этом )
function cycPHP2JS( line ){
	// а есть ли цикл
	
	//console.log( 'CYCLINE' )
	
	let pos = line.indexOf( 'foreach' )
	if( pos === -1 ){
		return line
	}
	
	// есть , будем преобразоваывать
	let posOpen  = line.indexOf( '(' , pos+1 )
	let posClose = line.indexOf( ')' , posOpen+1 )
	let argsline = line.substring( posOpen+1 , posClose )
	
	let part = argsline.split( ' as ' )
	
	// определяем массив , с которым производят foreach( ... )
	let arr = part[0].trim()
	
	part = part[1].split( '=>' )
	
	// определяем key и value
	let key = part[0].trim()
	let val = part[1].trim()
	
	// конструируем замену foreach на основе for( ... )
	// сделаем в одну строку , чтобы не сдвигать строки относительно файла источника
	line = 'for( '+key+'=0 ; '+key+'<'+arr+'.length ; '+key+'++ ) { '+val+' = '+arr+'['+key+']'
	
	return line
}


