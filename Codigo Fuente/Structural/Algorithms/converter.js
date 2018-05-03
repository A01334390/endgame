const fs = require('fs')
const Edge = require('../Structures/edge')
const Automata = require('../Structures/automata')
const reader = require('../Utilities/JSONReader')
const _ = require('lodash')

const HashMap = require('hashmap')
/**
 * This helps convert a EP-NFA to an NFA
 */
const convert = (filepath) => {
    //Retrieve the Automata from the JSON File
    let automata = reader.fetchProcesses('Automatas/flap.json')
    //The initial state of the DFA is the E-Closure of the initial state
    let dfastart = closure(automata.edges, automata.start.toString())
    //We can obtain their next destination
    let edges = []
    for (var sym in automata.symbols) {
        if (automata.symbols[sym] != 'epsilon') {
            let init = (extendedc(automata.edges, closure(automata.edges, automata.start.toString()), automata.symbols[sym]))
            let clos = []
            for (var i in init) {
                clos = clos.concat(closure(automata.edges, init[i]))
            }
            if (automata.symbols[sym] != '') {
                let t = new Edge(
                    dfastart.toString(),
                    _.union(clos).toString(),
                    automata.symbols[sym]
                )
                edges.push(t)
            }
        }
    }
    //Make a starter's DFA
    let dfa = new HashMap()
    //Set the initial node
    dfa.set(dfastart.toString(), edges)
    //Take epsilon out of the equation
    automata.symbols.splice(automata.symbols.indexOf('epsilon'), 1)
    //Play with it
    dfa = finalStage(automata.symbols, dfa, automata.edges)
    //check for duplicates
    dfa = duplicateRemover(dfa)
    //Make the new automata
    let auto = new Automata(
        dfa.keys(),
        automata.symbols,
        dfa,
        dfastart.toString(),
        calculateFinalStates(dfa,automata.end)
    )
    return auto
}

const duplicateRemover = (dfa) => {
    dfa.forEach(function(value,key){
        var ke1 = key.split(',').sort()
        dfa.forEach(function(val,k){
            var ke2 = k.split(',').sort()
            if(JSON.stringify(ke1) == JSON.stringify(ke2) && JSON.stringify(key) != JSON.stringify(k)){
                dfa.remove(key)
            }
        })
    })
    return dfa
}

const calculateFinalStates = (dfa,nfaend) => {
    let finalStates = []
    dfa.forEach(function(value,key){
        let elements = key.split(',')
        for(var elem in elements){
            for(var z in nfaend){
                if(nfaend[z] == elements[elem]){
                    finalStates.push(key)
                }
            }
        }
    })
    return finalStates
}

const finalStage = (symbols, dfa, odfa) => {
    //Get the initial size of the array
    let OLDSIZE = dfa.keys().length
    //Add the destination nodes to the DFA States
    dfa.forEach(function (value, key) {
        for (var val in value) {
            if (dfa.get(value[val].to.toString()) == undefined) {
                dfa.set(value[val].to.toString(), null)
            }
        }
    })
    //Get the new size of the array
    let NEWSIZE = dfa.keys().length
    //Get their new destinations
    for (key in dfa.keys()) {
        if (dfa.get(dfa.keys()[key]) == null) {
            let edges = []
            for (var sym in symbols) {
                let init = (extendedc(odfa, dfa.keys()[key].split(','), symbols[sym]))
                let clos = []
                for (var i in init) {
                    clos = clos.concat(closure(odfa, init[i]))
                }
                if (symbols[sym] != '') {
                    let t = new Edge(
                        dfa.keys()[key],
                        _.union(clos).toString(),
                        symbols[sym]
                    )
                    edges.push(t)
                }
            }
            dfa.set(dfa.keys()[key], edges)
        }

    }
    if (OLDSIZE != NEWSIZE) {
        return finalStage(symbols, dfa, odfa)
    } else {
        return dfa
    }
}

/**
 * This calculates the closure of Lambda for a set of Edges and States
 * @param {Edge[]} edges 
 * @param {String} state 
 */
const closure = (edges, state) => {
    let next = []
    let res = new HashMap()
    next.push(edges.get(state))
    res.set(state, edges.get(state))
    while (next.length != 0) {
        let edge = next.pop()
        for (var n in edge) {
            if (edge[n].symbol == 'epsilon') {
                for (var e in edge[n].to) {
                    if (!res.has(edge[n].to[e])) {
                        next.push(edges.get(edge[n].to[e]))
                        res.set(edge[n].to[e], edge[n])
                    }
                }
            }
        }
    }
    return res.keys()
}
/**
 * Makes the Extended Transition Function happen
 * @param {Automata} automata 
 * @param {List} closure 
 * @param {String} state 
 */
const extendedc = (automata, closure, symbol) => {
    let destiny = new HashMap()
    for (var r in closure) {
        let tuple = automata.get(closure[r])
        for (var d in tuple) {
            if (tuple[d].symbol == symbol) {
                for (var elem in tuple[d].to) {
                    destiny.set(tuple[d].to[elem], true)
                }
            }
        }
    }
    return destiny.keys()
}
/**
 * Takes care of the EP-NFA to NFA conversion
 * @param {Automata} automata 
 */
const firstStageConverter = (automata) => {
    //Get the transition Functions
    let nfa = new HashMap()
    automata.edges.forEach(function (values, key) {
        let edges = []
        for (var symbol in automata.symbols) {
            if (automata.symbols[symbol] != 'epsilon') {
                edges.push(depsilonizer(automata, key, automata.symbols[symbol]))
            }
        }
        nfa.set(key, edges)
    });
    //Check the end states
    let endStates = []
    for (var start in automata.start) {
        automata.edges.forEach(function (value, key) {
            for (var val in value) {
                if (automata.start[start] == key && value[val].symbol == 'epsilon') {
                    endStates.push(key)
                }
            }
        })
    }
    endStates.push.apply(endStates, automata.end)
    //Create the automata
    let nfatomata = new Automata(
        automata.states,
        automata.symbols = automata.symbols.filter(item => item != 'epsilon'),
        nfa,
        automata.start,
        endStates
    )
    return nfatomata
}

/**
 * This is the main working method to take epsilon out
 * @param {Automata} automata , The Original Automata
 */
const depsilonizer = (automata, state, symbol) => {
    //This new automata will hold all prev. states
    let nfa = new HashMap()
    //We have to initialize it with all prev. keys
    let clos01 = closure(automata.edges, state)
    let extended = extendedc(automata.edges, clos01, symbol)
    let temp = new HashMap()
    for (var ext in extended) {
        for (var clo in closure(automata.edges, extended[ext])) {
            temp.set(closure(automata.edges, extended[ext])[clo], true)
        }
    }
    let t = new Edge(
        state,
        temp.keys(),
        symbol
    )
    return t
}



module.exports = {
    convert
}