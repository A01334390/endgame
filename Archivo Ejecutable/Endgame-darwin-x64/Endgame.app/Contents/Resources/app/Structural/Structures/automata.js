//Pretty CLI functions
const Table = require('cli-table')
const chalk = require('chalk')
const HashMap = require('hashmap')
const reader = require('../Utilities/JSONReader')
//Homemade edge function
const Edge = require('./edge')
//Create the class
class Automata {
    /**
     * Starts the automata graph
     * @param {*} states 
     * @param {*} symbols 
     * @param {*} edges 
     * @param {*} start 
     * @param {*} end 
     */
    constructor(states,symbols,edges,start,end){
        this.states = states;
        this.symbols = symbols;
        this.edges = edges;
        this.start = start;
        this.end = end;
    }
}

module.exports = Automata