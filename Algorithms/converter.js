const fs = require('fs')
const Edge = require('../Structures/edge')
const Automata = require('../Structures/automata')
const reader = require('../Utilities/JSONReader')
const _ = require('lodash')

const HashMap = require('hashmap')
/**
 * This helps convert a EP-NFA to an NFA
 */
const convert = () => {
    //Retrieve the Automata from the JSON File
    let automata = reader.fetchProcesses('Automatas/auto2.json')
    //Check if it's an NFA, l-NFA or a DFA
    let nfa = null;
    //If it has an epsilon symbol, it is an l-NFA
    if (automata.symbols.includes('epsilon')) {
        nfa = firstStageConverter(automata)
    }
    let dfa = secondStageConverter(nfa)
    //The DFA is then served
    return dfa
}

/**
 * This calculates the closure of Lambda for a set of Edges and States
 * @param {Edge[]} edges 
 * @param {String} state 
 */
const closure = (edges, state) => {
    let next = []
    let res = new HashMap()
    if (elem = 'epsilon') {
        next.push(edges.get(state))
    }
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

/**
 * This takes care of the conversion from NFA to DFA
 * @param {Automata} nfa 
 */
const secondStageConverter = (nfa) => {
    //Get the new transition functions
    dfa = new HashMap()
    //Lets start the mapping all the new states known states
    dfa.set(nfa.start.toString(), nfa.edges.get(nfa.start.toString()))
    //We need to start making the needed changes
    dfa = finalStage(nfa.symbols, dfa, nfa.edges)
    //Check for duplicates
    dfa = isEqual(dfa)
    //Create the new automata
    let dfautomata = new Automata(
        dfa.keys(),
        nfa.symbols,
        dfa,
        nfa.start,
        calculateFinalStates(dfa.keys(), nfa.end)
    )
    return dfautomata
}

/**
 * This should return stuff
 * @param {Edges} dfa 
 */
const calculateFinalStates = (dfa, nfaend) => {
    let finalStates = []
    for (var i = 0; i < dfa.length; i++) {
        let elems = dfa[i].split(',')
        for (var x = 0; x < elems.length; x++) {
            for (var z = 0; z < nfaend.length; z++) {
                if (nfaend[z] == elems[x]) {
                    finalStates.push(dfa[i])
                }
            }
        }
    }
    return finalStates
}

/**
 * Checks if there are duplicate elements in the hashmap
 * @param {Automata} dfa 
 */
const isEqual = (dfa) => {
    //Get the keys
    let keys = dfa.keys()
    //Split the keys and sort them
    for (key in keys) {
        keys[key] = keys[key].split(",").sort()
    }
    //Check if there's a duplicate
    for (var key = 0; key < keys.length; key++) {
        for (var key2 = 0; key2 < keys.length; key2++) {
            if (key != key2 && keys[key].length == keys[key2].length && JSON.stringify(keys[key]) == (JSON.stringify(keys[key2]))) {
                dfa.delete(keys[key].toString())
            }
        }
    }

    return dfa
}

/**
 * There's a final stage for different states
 * @param {String[]} symbols 
 * @param {Automata} dfa 
 */
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
            let tupples = []
            for (var sym in symbols) {
                var keys = dfa.keys()[key].split(',')
                let edge = new Edge(
                    dfa.keys()[key],
                    extendedc(odfa, keys, symbols[sym]),
                    symbols[sym]
                )
                tupples.push(edge)
            }
            dfa.set(dfa.keys()[key].toString(), tupples)
        }
    }
    if (OLDSIZE != NEWSIZE) {
        return finalStage(symbols, dfa, odfa)
    } else {
        return dfa
    }
}

module.exports = {
    convert
}