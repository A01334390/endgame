const fs = require('fs')
const HashMap = require('hashmap')
const Edge = require('../Structures/edge')
const Automata = require('../Structures/automata')

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
                symbols.set(symbol,true)
            }
            states.set(key,true)
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
        console.error('An error was found:', e)
        process.exit(1)
    }
}

module.exports = {
    fetchProcesses
}