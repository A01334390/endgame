const reader = require('./JSONReader')
const Automata = require('../Structures/automata')
const converter = require('../Algorithms/converter')


var automata = converter.convert()
console.log(automata)