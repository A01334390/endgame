class Edge {
   /**
    * This is the main structure to create the graph
    * @param {*} from 
    * @param {*} to 
    * @param {*} symbol 
    */
    constructor(from,to,symbol){
        this.from = from;
        this.to = to;
        this.symbol = symbol;
    }
}

module.exports = Edge