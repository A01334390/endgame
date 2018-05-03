// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

//Electron libraries for correct functions
let $ = require('jquery')
let fs = require('fs')
let {
    dialog
} = require('electron').remote
let HashMap = require('hashmap')
//Homemade libraries
let Automata = require('./Structures/automata')
let Edge = require('./Structures/edge')
let convertAutomata;
let _ = require('lodash')

$('#info').on('click',()=>{
    location.reload()
})
//Deploy graph
$('#deploy').on('click', () => {
    var path = null
    if ($('#holder').text().trim() != 'Arrastra tu archivo aqui') {
        path = $('#holder').text()
    } else {
        alert('No has seleccionado ningun archivo, arrastra uno e intentalo de nuevo.')
        return;
    }
    convertAutomata = convert(path)
    console.log(convertAutomata)
    $('#chooser').empty()
    cyAutomataGrapher(convertAutomata);
    $('#info').append('<div id="return"><button>Regresar</button></div>')
})
/**
 * This method reads the file given by the user to graph it
 * @param {String} filepath 
 */
const fetchProcesses = (filepath) => {
    try {
        var processString = JSON.parse(fs.readFileSync(filepath))
        //Initialize these parameters for further programming
        let symbols = new HashMap()
        let states = new HashMap()
        let edges = []
        //Obtain required parameters to start
        for (var key in processString.automata.transition) {
            for (var symbol in processString.automata.transition[key]) {
                let temp = new Edge(
                    key,
                    processString.automata.transition[key][symbol],
                    symbol
                )
                edges.push(temp)
                symbols.set(symbol, true)
            }
            states.set(key, true)
        }
        let start = processString.automata.start
        let end = processString.automata.end
        //Create a HashMap to facilitate processing in the algorithm
        let map = new HashMap()
        for (var edge in edges) {
            if (map.get(edges[edge].from) == null) {
                let array = []
                array.push(edges[edge])
                map.set(edges[edge].from, array)
            } else {
                let array = map.get(edges[edge].from)
                array.push(edges[edge])
                map.set(edges[edge].from, array)
            }
        }
        //Make it an Automata
        let auto = new Automata(
            states.keys(),
            symbols.keys(),
            map,
            start,
            end
        )
        return auto
    } catch (e) {
        let myNotification = new Notification('A problem was found...', {
            body: 'Please check if the file you provided was a compatible JSON file'
        })
        console.error('An error was found:', e)
        process.exit(1)
    }
}

const convert = (filepath) => {
    //Retrieve the Automata from the JSON File
    let automata = fetchProcesses(filepath)
    //The initial state of the DFA is the E-Closure of the initial state
    let dfastart = closure(automata.edges, automata.start.toString()).sort()
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
                    _.union(clos).sort().toString(),
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
    //Remove duplicate states
    dfa = duplicateRemover(dfa)
    //Make new automata
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
                        _.union(clos).sort().toString(),
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

function cyAutomataGrapher(convertAutomata) {
    //Create the nodes needed to represent
    let nodesGEN = []
    convertAutomata.edges.forEach(function (val, key) {
        var obj = new Object()
        var data = new Object()
        if (key.length == 0) {
            data.id = "void"
            data.name = "void"
            data.label = "void"
            data.classes = 'center center'
        } else {
            data.id = key
            let initialS = false
                if (convertAutomata.start == key) {
                    initialS = true
                }
            let finalS = false
            for (var end in convertAutomata.end) {
                if (convertAutomata.end[end] == key) {
                    finalS = true
                }
            }

            if (initialS && finalS) {
                data.label = '>*' + key
            } else if (finalS) {
                data.label = '*' + key
            } else if (initialS) {
                data.label = '>' + key
            } else {
                data.label = key
            }

            data.name = key
            data.classes = 'bottom-center'
        }
        obj.data = data
        nodesGEN.push(obj)
    })
    //Create the arcs
    let edgesGEN = []
    convertAutomata.edges.forEach(function (value, key) {
        for (val in value) {
            var obj = new Object()
            var data = new Object()
            if (value[val].from.length == 0) {
                data.source = "void"
            } else {
                data.source = value[val].from
            }

            if (value[val].to.toString().length == 0) {
                data.target = "void"
            } else {
                data.target = value[val].to.toString()
            }

            data.label = value[val].symbol
            console.log(data.label)

            obj.data = data
            edgesGEN.push(obj)
        }
    })
    console.log(JSON.parse(JSON.stringify(edgesGEN)))
    var cy = cytoscape({
        container: document.querySelector('#cy'),
        boxSelectionEnabled: false,
        autounselectify: true,
        style: [{
                "selector": "node",
                "style": {
                    "height": 40,
                    "width": 40,
                    "background-color": '#9C225D',
                    "label": "data(label)"
                }
            },

            {
                "selector": "edge",
                "style": {
                    "label": "data(label)",
                    "width": 3,
                    "line-color": '#FFCC00',
                    "curve-style": 'bezier',
                    'target-arrow-shape': 'triangle',
                    'target-arrow-color': 'black'
                }
            },

            {
                "selector": ".top-left",
                "style": {
                    "text-valign": "top",
                    "text-halign": "left"
                }
            },

            {
                "selector": ".top-center",
                "style": {
                    "text-valign": "top",
                    "text-halign": "center"
                }
            },

            {
                "selector": ".top-right",
                "style": {
                    "text-valign": "top",
                    "text-halign": "right"
                }
            },

            {
                "selector": ".center-left",
                "style": {
                    "text-valign": "center",
                    "text-halign": "left"
                }
            },

            {
                "selector": ".center-center",
                "style": {
                    "text-valign": "center",
                    "text-halign": "center"
                }
            },

            {
                "selector": ".center-right",
                "style": {
                    "text-valign": "center",
                    "text-halign": "right"
                }
            },

            {
                "selector": ".bottom-left",
                "style": {
                    "text-valign": "bottom",
                    "text-halign": "left"
                }
            },

            {
                "selector": ".bottom-center",
                "style": {
                    "text-valign": "bottom",
                    "text-halign": "center"
                }
            },

            {
                "selector": ".bottom-right",
                "style": {
                    "text-valign": "bottom",
                    "text-halign": "right"
                }
            },

            {
                "selector": ".multiline-manual",
                "style": {
                    "text-wrap": "wrap"
                }
            },

            {
                "selector": ".multiline-auto",
                "style": {
                    "text-wrap": "wrap",
                    "text-max-width": 80
                }
            },

            {
                "selector": ".autorotate",
                "style": {
                    "edge-text-rotation": "autorotate"
                }
            },

            {
                "selector": ".background",
                "style": {
                    "text-background-opacity": 1,
                    "text-background-color": "#ccc",
                    "text-background-shape": "roundrectangle",
                    "text-border-color": "#000",
                    "text-border-width": 1,
                    "text-border-opacity": 1
                }
            },

            {
                "selector": ".outline",
                "style": {
                    "text-outline-color": "#ccc",
                    "text-outline-width": 3
                }
            }
        ],
        elements: {
            nodes: nodesGEN,
            edges: edgesGEN
        },
        layout: {
            name: 'grid',
            padding: 10
        }
    });
    cy.on('tap', 'node', function (e) {
        var node = e.cyTarget;
        var neighborhood = node.neighborhood().add(node);
        cy.elements().addClass('faded');
        neighborhood.removeClass('faded');
    });
    cy.on('tap', function (e) {
        if (e.cyTarget === cy) {
            cy.elements().removeClass('faded');
        }
    });

    let myNotification = new Notification('Graph is ready!', {
        body: 'Your λ-NFA has been successfully converted'
    })
}